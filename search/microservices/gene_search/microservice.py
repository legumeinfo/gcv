#!/usr/bin/env python

# Python
import argparse
import asyncio
# module
from database import connectToRedis
from grpc_server import run_grpc_server
from http_server import run_http_server
from request_handler import RequestHandler



def parseArgs():

  # create the parser
  parser = argparse.ArgumentParser(
    description='A microservice for finding gene names similar to the given query.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # Async HTTP args
  parser.add_argument('--no-http', dest='http', action='store_false', help='Don\'t run the HTTP server.')
  parser.set_defaults(http=True)
  parser.add_argument('--hhost', type=str, default='localhost', help='The HTTP server host.')
  parser.add_argument('--hport', type=str, default='8080', help='The HTTP server port.')

  # gRPC args
  parser.add_argument('--no-grpc', dest='grpc', action='store_false', help='Don\'t run the gRPC server.')
  parser.set_defaults(grpc=True)
  parser.add_argument('--ghost', type=str, default='[::]', help='The gRPC server host.')
  parser.add_argument('--gport', type=str, default='8081', help='The gRPC server port.')

  # Redis args
  parser.add_argument('--rdb', type=int, default=0, help='The Redis database.')
  parser.add_argument('--rpassword', type=str, default='', help='The Redis password.')
  parser.add_argument('--rhost', type=str, default='localhost', help='The Redis host.')
  parser.add_argument('--rport', type=int, default=6379, help='The Redis port.')

  return parser.parse_args()


if __name__ == '__main__':
  args = parseArgs()
  if not args.http and not args.grpc:
    exit('--http or --grpc must be True')
  redis_connection = connectToRedis(args.rhost, args.rport, args.rdb, args.rpassword)
  handler = RequestHandler(redis_connection)
  loop = asyncio.get_event_loop()
  if args.http:
    loop.create_task(run_http_server(args.hhost, args.hport, handler))
  if args.grpc:
    loop.create_task(run_grpc_server(args.ghost, args.gport, handler))
  loop.run_forever()
