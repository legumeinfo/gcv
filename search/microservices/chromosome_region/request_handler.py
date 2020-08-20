# dependencies
from redisearch import Client, NumericFilter, Query


class RequestHandler:

  def __init__(self, redis_connection):
    self.redis_connection = redis_connection

  # TODO: use aioredis and call redisearch via .execute to prevent blocking
  # https://redislabs.com/blog/beyond-the-cache-with-python/
  async def process(self, chromosome, start, stop):
    # connect to the index
    gene_index = Client('geneIdx', conn=self.redis_connection)
    # count how many genes fall into the chromosome interval
    query = Query(chromosome)\
              .limit_fields('chromosome')\
              .verbatim()\
              .add_filter(NumericFilter('fmin', start, stop))\
              .add_filter(NumericFilter('fmax', start, stop))\
              .paging(0, 0)
    result = gene_index.search(query)
    if result.total == 0:
      return None
    # compute the number of flanking genes and retrieve only the center gene
    neighbors = result.total//2
    query = Query(chromosome)\
              .limit_fields('chromosome')\
              .verbatim()\
              .add_filter(NumericFilter('fmin', start, stop))\
              .add_filter(NumericFilter('fmax', start, stop))\
              .sort_by('fmin')\
              .return_fields('name')\
              .paging(neighbors, 1)
    result = gene_index.search(query)
    gene = result.docs[0].name
    return {'gene': gene, 'neighbors': neighbors}
