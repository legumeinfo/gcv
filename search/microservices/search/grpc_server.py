# dependencies
from grpc.experimental import aio
# module
import search_pb2
import search_pb2_grpc


class Search(search_pb2_grpc.SearchServicer):

  def __init__(self, handler):
    self.handler = handler

  async def Search(self, request, context):
    results = await self.handler.process(request.query)
    return search_pb2.SearchReply(results=results)


async def run_grpc_server(host, port, query_parser):
  server = aio.server()
  server.add_insecure_port(f'{host}:{port}')
  servicer = Search(query_parser)
  search_pb2_grpc.add_SearchServicer_to_server(servicer, server)
  await server.start()
  await server.wait_for_termination()
