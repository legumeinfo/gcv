#!/usr/bin/env python

# dependencies
import aiohttp_cors
import argparse
import redisearch
from aiohttp import web
# module
from database import connectToRedis
from query_parser import makeQueryParser



def parseArgs():

  # create the parser
  parser = argparse.ArgumentParser(
    description='An HTTP server for resolving GCV search queries.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # Async HTTP args
  parser.add_argument('--hhost', type=str, default='localhost', help='The HTTP server host.')
  parser.add_argument('--hport', type=str, default='8080', help='The HTTP server port.')

  # Redis args
  parser.add_argument('--rdb', type=int, default=0, help='The Redis database.')
  parser.add_argument('--rpassword', type=str, default='', help='The Redis password.')
  parser.add_argument('--rhost', type=str, default='localhost', help='The Redis host.')
  parser.add_argument('--rport', type=int, default=6379, help='The Redis port.')

  # query parser args
  parser.add_argument('--chars', type=str, default='._-', help='Special characters allowed in gene and chromosome names.')

  return parser.parse_args()


async def get_handler(request):
  # connect to the index
  redis_connection = request.app['redis_connection']
  gene_index = redisearch.Client('geneIdx', conn=redis_connection)
  # parse the query from the URL query string parameters
  query = request.rel_url.query.get('q', '')
  # parser the query and search the indexes
  parser = request.app['query_parser']
  search_results = {'genes': []}
  for results, start, end in parser.scanString(query):
    if 'genes' in results:
      for name, in results['genes']:
        result = gene_index.search(query)
        genes = list(map(lambda d: d.name, result.docs))
        search_results['genes'].extend(genes)
  return web.json_response(search_results)


if __name__ == '__main__':
  args = parseArgs()
  app = web.Application()
  cors = aiohttp_cors.setup(app, defaults={
    '*': aiohttp_cors.ResourceOptions(
           allow_credentials=True,
           expose_headers='*',
           allow_headers='*',
         )
  })
  app['redis_connection'] = connectToRedis(args.rhost, args.rport, args.rdb, args.rpassword)
  app['query_parser'] = makeQueryParser(args.chars)
  route = app.router.add_get('/search', get_handler)
  cors.add(route)
  web.run_app(app, host=args.hhost, port=args.hport)
