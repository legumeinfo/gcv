#!/usr/bin/env python

# Python
import argparse
import asyncio
# module
from grpc_client import GENE_SEARCH_ADDR
from grpc_server import run_grpc_server
from http_server import run_http_server
from query_parser import makeQueryParser
from request_handler import RequestHandler


def parseArgs():

  # create the parser
  parser = argparse.ArgumentParser(
    description='An HTTP server for resolving GCV search queries.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # Async HTTP args
  parser.add_argument('--no-http', dest='http', action='store_false', help='Don\'t run the HTTP server.')
  parser.set_defaults(http=True)
  parser.add_argument('--hhost', type=str, default='localhost', help='The HTTP server host.')
  parser.add_argument('--hport', type=str, default='8080', help='The HTTP server port.')

  # gRPC args
  parser.add_argument('--no-grpc', dest='grpc', action='store_false', help='Don\'t run the gRPC server.')
  parser.set_defaults(http=True)
  parser.add_argument('--ghost', type=str, default='localhost', help='The gRPC server host.')
  parser.add_argument('--gport', type=str, default='8081', help='The gRPC server port.')

  # Inter-microservice communication args
  parser.add_argument('--geneaddr', type=str, default=GENE_SEARCH_ADDR, help='The address of the gene search microservice (supports environment variables prefixed with "$").')
  #parser.add_argument('--chromosomeaddr', type=str, default=CHROMOSOME_SEARCH_ADDR, help='The address of the chromosome search microservice (supports environment variables prefixed with "$").')
  #parser.add_argument('--regionaddr', type=str, default=CHROMOSOME_REGION_ADDR, help='The address of the chromosome region microservice (supports environment variables prefixed with "$").')

  # query parser args
  parser.add_argument('--chars', type=str, default='._-', help='Special characters allowed in gene and chromosome names.')

  return parser.parse_args()


if __name__ == '__main__':
  args = parseArgs()
  if not args.http and not args.grpc:
    exit('--http or --grpc must be True')
  query_parser = makeQueryParser(args.chars)
  handler = RequestHandler(query_parser, args.geneaddr)
  loop = asyncio.get_event_loop()
  if args.http:
    loop.create_task(run_http_server(args.hhost, args.hport, handler))
  if args.grpc:
    loop.create_task(run_grpc_server(args.ghost, args.gport, handler))
  loop.run_forever()
