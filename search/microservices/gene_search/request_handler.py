# dependencies
import redisearch


class RequestHandler:

  def __init__(self, redis_connection):
    self.redis_connection = redis_connection

  # TODO: use aioredis and call redisearch via .execute to prevent blocking
  # https://redislabs.com/blog/beyond-the-cache-with-python/
  async def process(self, query):
    # connect to the index
    gene_index = redisearch.Client('geneIdx', conn=self.redis_connection)
    # search the gene index
    result = gene_index.search(query)
    genes = list(map(lambda d: d.name, result.docs))
    return genes
