#!/usr/bin/env python

# Python
import argparse
import asyncio
import uvloop
# module
from database import connectToRedis
from grpc_server import run_grpc_server
from http_server import run_http_server
from request_handler import RequestHandler



def parseArgs():

  # create the parser
  parser = argparse.ArgumentParser(
    description='A microservice for retrieving a region from a given chromosome.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # Async HTTP args
  parser.add_argument('--no-http', dest='nohttp', action='store_true', help='Don\'t run the HTTP server.')
  parser.set_defaults(nohttp=False)
  parser.add_argument('--hhost', type=str, default='localhost', help='The HTTP server host.')
  parser.add_argument('--hport', type=str, default='8080', help='The HTTP server port.')

  # gRPC args
  parser.add_argument('--no-grpc', dest='nogrpc', action='store_true', help='Don\'t run the gRPC server.')
  parser.set_defaults(nogrpc=False)
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
  if args.nohttp and args.nogrpc:
    exit('--no-http and --no-grpc can\'t both be given')
  redis_connection = connectToRedis(args.rhost, args.rport, args.rdb, args.rpassword)
  handler = RequestHandler(redis_connection)
  uvloop.install()
  loop = asyncio.get_event_loop()
  if not args.nohttp:
    loop.create_task(run_http_server(args.hhost, args.hport, handler))
  if not args.nogrpc:
    loop.create_task(run_grpc_server(args.ghost, args.gport, handler))
  loop.run_forever()
