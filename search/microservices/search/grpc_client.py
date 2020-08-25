# Python
import os
# dependencies
from grpc.experimental import aio
# module
import genesearch_pb2
import genesearch_pb2_grpc
import chromosomesearch_pb2
import chromosomesearch_pb2_grpc
import chromosomeregion_pb2
import chromosomeregion_pb2_grpc


GENE_SEARCH_ADDR = '$GENE_SEARCH_ADDR'
CHROMOSOME_SEARCH_ADDR = '$CHROMOSOME_SEARCH_ADDR'
CHROMOSOME_REGION_ADDR = '$CHROMOSOME_REGION_ADDR'


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
  try:
    results = await stub.Search(genesearch_pb2.SearchRequest(query=query))
    return results.genes
  except:
    return []


async def chromosome_search(query, address):
  # fetch channel every time to support dynamic services
  target = parseTarget(address)
  channel = aio.insecure_channel(target)
  await channel.channel_ready()
  stub = chromosomesearch_pb2_grpc.ChromosomeSearchStub(channel)
  try:
    results = await stub.Search(chromosomesearch_pb2.SearchRequest(query=query))
    return results.chromosomes
  except:
    return []


async def chromosome_region(chromosome, start, stop, address):
  # fetch channel every time to support dynamic services
  target = parseTarget(address)
  channel = aio.insecure_channel(target)
  await channel.channel_ready()
  stub = chromosomeregion_pb2_grpc.ChromosomeRegionStub(channel)
  try:
    region = await stub.GetRegion(chromosomeregion_pb2.RegionRequest(chromosome=chromosome, start=start, stop=stop))
    return [{'gene': region.gene, 'neighbors': region.neighbors}]
  except:
    return []
