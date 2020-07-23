# dependencies
from grpc.experimental import aio
# module
import genesearch_pb2
import genesearch_pb2_grpc


class GeneSearch(genesearch_pb2_grpc.GeneSearchServicer):

  def __init__(self, handler):
    self.handler = handler

  async def Search(self, request, context):
    genes = await self.handler.process(request.query)
    return genesearch_pb2.SearchReply(genes=genes)


async def run_grpc_server(host, port, handler):
  server = aio.server()
  server.add_insecure_port(f'{host}:{port}')
  servicer = GeneSearch(handler)
  genesearch_pb2_grpc.add_GeneSearchServicer_to_server(servicer, server)
  await server.start()
  await server.wait_for_termination()
