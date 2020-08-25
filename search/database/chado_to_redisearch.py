#!/usr/bin/env python

import argparse
import redisearch
import sys
from collections import defaultdict
from database import connectToChado, connectToRedis


def parseArgs():

  # create the parser
  parser = argparse.ArgumentParser(
    description='Loads data from a Chado (PostreSQL) database into a RediSearch index.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # PostgreSQL args
  parser.add_argument('--pdb', type=str, default='chado', help='The PostgreSQL database.')
  parser.add_argument('--puser', type=str, default='chado', help='The PostgreSQL username.')
  parser.add_argument('--ppassword', type=str, default=None, help='The PostgreSQL password.')
  parser.add_argument('--phost', type=str, default='localhost', help='The PostgreSQL host.')
  parser.add_argument('--pport', type=int, default=5432, help='The PostgreSQL port.')

  # Redis args
  parser.add_argument('--rdb', type=int, default=0, help='The Redis database.')
  parser.add_argument('--rpassword', type=str, default='', help='The Redis password.')
  parser.add_argument('--rhost', type=str, default='localhost', help='The Redis host.')
  parser.add_argument('--rport', type=int, default=6379, help='The Redis port.')
  parser.add_argument('--rchunksize', type=int, default=100, help='The chunk size to be used for Redis batch processing.')
  parser.add_argument('--no-reload', dest='noreload', action='store_true', help='Don\'t load a search index if it already exists.')
  parser.set_defaults(noreload=False)

  return parser.parse_args()


def _getCvterm(c, name):
  # get the cvterm
  query = ('SELECT cvterm_id '
           'FROM cvterm '
           'WHERE name=\'' + name + '\' '
           'AND cv_id = (select cv_id from cv where name=\'sequence\');')
  c.execute(query)
  # does it exist?
  if not c.rowcount:
    raise Exception('Failed to retrieve the "' + name + '" cvterm entry')
  term, = c.fetchone()
  return term


def _replacePreviousPrintLine(newline):
  sys.stdout.write('\033[F') # back to previous line
  sys.stdout.write('\033[K') # clear line
  print(newline)


def transferChromosomes(postgres_connection, redis_connection, chunk_size, noreload):

  print('Loading chromosomes...')
  # prepare RediSearch
  indexName = 'chromosomeIdx'
  chromosome_index = redisearch.Client(indexName, conn=redis_connection)
  # TODO: there should be an extend argparse flag that prevents deletion
  try:
    chromosome_index.info()
    if noreload:  # previous line will error if index doesn't exist
      print(f'\t"{indexName}" already exists in RediSearch')
      return
    msg = '\tClearing index... {}'
    print(msg.format(''))
    chromosome_index.drop_index()
    _replacePreviousPrintLine(msg.format('done'))
  except Exception as e:
    print(e)
  fields = [redisearch.TextField('name')]
  chromosome_index.create_index(fields)
  indexer = chromosome_index.batch_indexer(chunk_size=chunk_size)

  with postgres_connection.cursor() as c:

    # get cvterms
    msg = '\tLoading cvterms... {}'
    print(msg.format(''))
    chromosome_id = _getCvterm(c, 'chromosome')
    supercontig_id = _getCvterm(c, 'supercontig')
    _replacePreviousPrintLine(msg.format('done'))

    # get all the chromosomes
    msg = '\tLoading chromosomes... {}'
    print(msg.format(''))
    i = 0
    query = ('SELECT feature_id, name '
             'FROM feature '
             'WHERE type_id=' + str(chromosome_id) + ' '
             'OR type_id=' + str(supercontig_id) + ';')
    c.execute(query)
    _replacePreviousPrintLine(msg.format('done'))

    # index the chromosomes
    msg = '\tIndexing chromosomes... {}'
    print(msg.format(''))
    chromosome_id_name_map = {}
    for (chr_id, chr_name,) in c:
      chromosome_id_name_map[chr_id] = chr_name
      indexer.add_document(f'{indexName}_{i}', name=chr_name)
      i += 1
    indexer.commit()
    _replacePreviousPrintLine(msg.format('done'))

    return chromosome_id_name_map


def transferGenes(postgres_connection, redis_connection, chunk_size, noreload, chromosome_id_name_map):

  print('Loading genes...')
  # prepare RediSearch
  indexName = 'geneIdx'
  interval_index = redisearch.Client(indexName, conn=redis_connection)
  # TODO: there should be an extend argparse flag that prevents deletion
  try:
    interval_index.info()
    if noreload:  # previous line will error if index doesn't exist
      print(f'\t"{indexName}" already exists in RediSearch')
      return
    msg = '\tClearing index... {}'
    print(msg.format(''))
    interval_index.drop_index()
    _replacePreviousPrintLine(msg.format('done'))
  except Exception as e:
    print(e)
  fields = [
      redisearch.TextField('chromosome'),
      redisearch.TextField('name'),
      redisearch.NumericField('fmin'),
      redisearch.NumericField('fmax'),
    ]
  interval_index.create_index(fields)
  indexer = interval_index.batch_indexer(chunk_size=chunk_size)

  with postgres_connection.cursor() as c:

    # get cvterms
    msg = '\tLoading cvterms... {}'
    print(msg.format(''))
    gene_id = _getCvterm(c, 'gene')
    _replacePreviousPrintLine(msg.format('done'))

    # get all the genes
    msg = '\tLoading genes... {}'
    print(msg.format(''))
    query = ('SELECT fl.srcfeature_id, f.name, fl.fmin, fl.fmax '
             'FROM featureloc fl, feature f '
             'WHERE fl.feature_id=f.feature_id '
             'AND f.type_id=' + str(gene_id) + ';')
    c.execute(query)
    _replacePreviousPrintLine(msg.format('done'))

    # index the genes
    msg = '\tIndexing genes... {}'
    print(msg.format(''))
    i = 0
    for (chr_id, g_name, g_fmin, g_fmax,) in c:
      if chr_id in chromosome_id_name_map:
        chr_name = chromosome_id_name_map[chr_id]
        indexer.add_document(
          f'{indexName}_{i}',
          chromosome=chr_name,
          name=g_name,
          fmin=g_fmin,
          fmax=g_fmax,
        )
        i += 1
    indexer.commit()
    _replacePreviousPrintLine(msg.format('done'))


def transferData(postgres_connection, redis_connection, chunk_size, noreload):

  chromosome_id_name_map = transferChromosomes(postgres_connection, redis_connection, chunk_size, noreload)
  transferGenes(postgres_connection, redis_connection, chunk_size, noreload, chromosome_id_name_map)


if __name__ == '__main__':
  args = parseArgs()
  # connect to the databases
  postgres_connection = None
  redis_connection = None
  msg = 'Connecting to PostgreSQL... {}'
  print(msg.format(''))
  try:
    postgres_connection = connectToChado(args.pdb, args.puser, args.ppassword, args.phost, args.pport)
  except Exception as e:
    _replacePreviousPrintLine(msg.format('failed'))
    exit(e)
  _replacePreviousPrintLine(msg.format('done'))
  msg = 'Connecting to Redis... {}'
  print(msg.format(''))
  try:
    redis_connection = connectToRedis(args.rhost, args.rport, args.rdb, args.rpassword)
  except Exception as e:
    _replacePreviousPrintLine(msg.format('failed'))
    exit(e)
  _replacePreviousPrintLine(msg.format('done'))
  # transfer the relevant data from Chado to Redis
  try:
    transferData(postgres_connection, redis_connection, args.rchunksize, args.noreload)
  except Exception as e:
    print(e)
  # disconnect from the database
  postgres_connection.close()
