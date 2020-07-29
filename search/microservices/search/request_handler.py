# module
from grpc_client import gene_search, chromosome_search
from query_parser import makeQueryParser


class RequestHandler:

  def __init__(self, parser, gene_address, chromosome_address):
    self.parser = parser
    self.gene_address = gene_address
    self.chromosome_address = chromosome_address

  async def process(self, query):
    # parser the query and search the indexes
    search_results = {'genes': []}
    for results, start, end in self.parser.scanString(query):
      if 'genes' in results:
        for name, in results['genes']:
          genes = await gene_search(name, self.gene_address)
          search_results['genes'].extend(genes)
      if 'regions' in results:
        for name, start, stop in results['regions']:
          chromosomes = await chromosome_search(name, self.chromosome_address)
    return search_results
