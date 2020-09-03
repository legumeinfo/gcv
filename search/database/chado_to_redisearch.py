#!/usr/bin/env python

# Python
import argparse
import os
import sys
from collections import defaultdict
# dependencies
import redisearch
# module
from database import connectToChado, connectToRedis


# a class that loads argument values from command line variables, resulting in a
# value priority: command line > environment variable > default value
class EnvArg(argparse.Action):

  def __init__(self, envvar, required=False, default=None, **kwargs):
    if envvar in os.environ:
      default = os.environ[envvar]
    if required and default is not None:
      required = False
    super(EnvArg, self).__init__(default=default, required=required, **kwargs)

  def __call__(self, parser, namespace, values, option_string=None):
    setattr(namespace, self.dest, values)


def parseArgs():

  # create the parser
  parser = argparse.ArgumentParser(
    description='Loads data from a Chado (PostreSQL) database into a RediSearch index for use by the GCV search microservices.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # PostgreSQL args
  pdb_envvar = 'POSTGRES_DB'
  parser.add_argument('--pdb', action=EnvArg, envvar=pdb_envvar, type=str, default='chado', help=f'The PostgreSQL database (can also be specified using the {pdb_envvar} environment variable).')
  puser_envvar = 'POSTGRES_USER'
  parser.add_argument('--puser', action=EnvArg, envvar=puser_envvar, type=str, default='chado', help=f'The PostgreSQL username (can also be specified using the {puser_envvar} environment variable).')
  ppassword_envvar = 'POSTGRES_PASSWORD'
  parser.add_argument('--ppassword', action=EnvArg, envvar=ppassword_envvar, type=str, default=None, help=f'The PostgreSQL password (can also be specified using the {ppassword_envvar} environment variable).')
  phost_envvar = 'POSTGRES_HOST'
  parser.add_argument('--phost', action=EnvArg, envvar=phost_envvar, type=str, default='localhost', help=f'The PostgreSQL host (can also be specified using the {phost_envvar} environment variable).')
  pport_envvar = 'POSTGRES_PORT'
  parser.add_argument('--pport', action=EnvArg, envvar=pport_envvar, type=int, default=5432, help=f'The PostgreSQL port (can also be specified using the {pport_envvar} environment variable).')

  # Redis args
  rdb_envvar = 'REDIS_DB'
  parser.add_argument('--rdb', action=EnvArg, envvar=rdb_envvar, type=int, default=0, help=f'The Redis database (can also be specified using the {rdb_envvar} environment variable).')
  rpassword_envvar = 'REDIS_PASSWORD'
  parser.add_argument('--rpassword', action=EnvArg, envvar=rpassword_envvar, type=str, default='', help=f'The Redis password (can also be specified using the {rpassword_envvar} environment variable).')
  rhost_envvar = 'REDIS_HOST'
  parser.add_argument('--rhost', action=EnvArg, envvar=rhost_envvar, type=str, default='localhost', help=f'The Redis host (can also be specified using the {rhost_envvar} environment variable).')
  rport_envvar = 'REDIS_PORT'
  parser.add_argument('--rport', action=EnvArg, envvar=rport_envvar, type=int, default=6379, help=f'The Redis port (can also be specified using the {rport_envvar} environment variable).')
  rchunksize_envvar = 'REDIS_CHUNK_SIZE'
  parser.add_argument('--rchunksize', action=EnvArg, envvar=rchunksize_envvar, type=int, default=100, help=f'The chunk size to be used for Redis batch processing (can also be specified using the {rchunksize_envvar} environment variable).')
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
