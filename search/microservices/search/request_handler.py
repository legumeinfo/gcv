# module
from grpc_client import gene_search
from query_parser import makeQueryParser


class RequestHandler:

  def __init__(self, parser, gene_address):
    self.parser = parser
    self.gene_address = gene_address

  async def process(self, query):
    # parser the query and search the indexes
    search_results = {'genes': []}
    for results, start, end in self.parser.scanString(query):
      if 'genes' in results:
        for name, in results['genes']:
          # TODO: call gene search microservice
          genes = await gene_search(query, self.gene_address)
          search_results['genes'].extend(genes)
    return search_results
