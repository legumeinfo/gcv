# Python
import os
# dependencies
from grpc.experimental import aio
# module
import genesearch_pb2
import genesearch_pb2_grpc
import chromosomesearch_pb2
import chromosomesearch_pb2_grpc


GENE_SEARCH_ADDR = '$GENE_SEARCH_ADDR'
CHROMOSOME_SEARCH_ADDR = '$CHROMOSOME_SEARCH_ADDR'
#CHROMOSOME_REGION_ADDR = '$CHROMOSOME_REGION_ADDR'


def parseTarget(address):
  if address.startswith('$'):
    return os.environ.get(address[1:])
  return address


async def gene_search(query, address):
  # fetch channel every time to support dynamic services
  target = parseTarget(address)
  channel = aio.insecure_channel(target)
  await channel.channel_ready()
  stub = genesearch_pb2_grpc.GeneSearchStub(channel)
  results = await stub.Search(genesearch_pb2.SearchRequest(query=query))
  return results.genes


async def chromosome_search(query, address):
  # fetch channel every time to support dynamic services
  target = parseTarget(address)
  channel = aio.insecure_channel(target)
  await channel.channel_ready()
  stub = chromosomesearch_pb2_grpc.ChromosomeSearchStub(channel)
  results = await stub.Search(chromosomesearch_pb2.SearchRequest(query=query))
  return results.chromosomes
