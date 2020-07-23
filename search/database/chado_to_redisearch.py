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


def transferData(postgres_connection, redis_connection, chunk_size):

  # prepare RediSearch
  gene_index = redisearch.Client('geneIdx', conn=redis_connection)
  # TODO: there should be an extend argparse flag that prevents deletion
  try:
    msg = 'Clearing index... {}'
    print(msg.format(''))
    gene_index.drop_index()
    _replacePreviousPrintLine(msg.format('done'))
  except Exception as e:
    print(e)
  fields = [redisearch.TextField('name')]
  gene_index.create_index(fields)
  indexer = gene_index.batch_indexer(chunk_size=chunk_size)

  print('Transferring data...')
  with postgres_connection.cursor() as c:

    # get cvterms
    msg = '\tLoading cvterms... {}'
    print(msg.format(''))
    gene_id = _getCvterm(c, 'gene')
    _replacePreviousPrintLine(msg.format('done'))

    # get all the genes and index them
    msg = '\tLoading genes... {}'
    print(msg.format(''))
    i = 0
    query = ('SELECT name '
             'FROM feature '
             'WHERE type_id=' + str(gene_id) + ';')
    c.execute(query)
    _replacePreviousPrintLine(msg.format('done'))
    msg = '\tIndexing genes... {}'
    print(msg.format(''))
    for (name,) in c:
      indexer.add_document('doc' + str(i), name=name)
      i += 1
    indexer.commit()
    _replacePreviousPrintLine(msg.format('done'))


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
    transferData(postgres_connection, redis_connection, args.rchunksize)
  except Exception as e:
    print(e)
  # disconnect from the database
  postgres_connection.close()
