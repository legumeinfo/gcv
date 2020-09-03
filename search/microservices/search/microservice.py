#!/usr/bin/env python

# Python
import argparse
import asyncio
import os
import uvloop
# module
from grpc_server import run_grpc_server
from http_server import run_http_server
from query_parser import makeQueryParser
from request_handler import RequestHandler


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
    description='A microservice for resolving GCV search queries.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

  # Async HTTP args
  parser.add_argument('--no-http', dest='nohttp', action='store_true', help='Don\'t run the HTTP server.')
  parser.set_defaults(nohttp=False)
  hhost_envvar = 'HTTP_HOST'
  parser.add_argument('--hhost', action=EnvArg, envvar=hhost_envvar, type=str, default='localhost', help=f'The HTTP server host (can also be specified using the {hhost_envvar} environment variable).')
  hport_envvar = 'HTTP_PORT'
  parser.add_argument('--hport', action=EnvArg, envvar=hport_envvar, type=str, default='8080', help=f'The HTTP server port (can also be specified using the {hport_envvar} environment variable).')

  # gRPC args
  parser.add_argument('--no-grpc', dest='nogrpc', action='store_true', help='Don\'t run the gRPC server.')
  parser.set_defaults(nogrpc=False)
  ghost_envvar = 'GRPC_HOST'
  parser.add_argument('--ghost', action=EnvArg, envvar=ghost_envvar, type=str, default='[::]', help=f'The gRPC server host (can also be specified using the {ghost_envvar} environment variable).')
  gport_envvar = 'GRPC_PORT'
  parser.add_argument('--gport', action=EnvArg, envvar=gport_envvar, type=str, default='8081', help=f'The gRPC server port (can also be specified using the {gport_envvar} environment variable).')

  # Inter-microservice communication args
  geneaddr_envvar = 'GENE_SEARCH_ADDR'
  parser.add_argument('--geneaddr', action=EnvArg, envvar=geneaddr_envvar, type=str, required=True, help=f'The address of the gene search microservice (can also be specified using the {geneaddr_envvar} environment variable).')
  chromosomeaddr_envvar = 'CHROMOSOME_SEARCH_ADDR'
  parser.add_argument('--chromosomeaddr', action=EnvArg, envvar=chromosomeaddr_envvar, type=str, required=True, help=f'The address of the chromosome search microservice (can also be specified using the {chromosomeaddr_envvar} environment variable).')
  regionaddr_envvar = 'CHROMOSOME_REGION_ADDR'
  parser.add_argument('--regionaddr', action=EnvArg, envvar=regionaddr_envvar, type=str, required=True, help=f'The address of the chromosome region microservice (can also be specified using the {regionaddr_envvar} environment variable).')

  # query parser args
  parser.add_argument('--chars', type=str, default='._-', help='Special characters allowed in gene and chromosome names.')

  return parser.parse_args()


if __name__ == '__main__':
  args = parseArgs()
  if args.nohttp and args.nogrpc:
    exit('--no-http and --no-grpc can\'t both be given')
  query_parser = makeQueryParser(args.chars)
  handler = RequestHandler(query_parser, args.geneaddr, args.chromosomeaddr, args.regionaddr)
  uvloop.install()
  loop = asyncio.get_event_loop()
  if not args.nohttp:
    loop.create_task(run_http_server(args.hhost, args.hport, handler))
  if not args.nogrpc:
    loop.create_task(run_grpc_server(args.ghost, args.gport, handler))
  loop.run_forever()
