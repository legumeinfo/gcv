# dependencies
import redisearch


class RequestHandler:

  def __init__(self, redis_connection):
    self.redis_connection = redis_connection

  # TODO: use aioredis and call redisearch via .execute to prevent blocking
  # https://redislabs.com/blog/beyond-the-cache-with-python/
  async def process(self, query):
    # connect to the index
    chromosome_index = redisearch.Client('chromosomeIdx', conn=self.redis_connection)
    # search the chromosome index
    result = chromosome_index.search(query)
    chromosomes = list(map(lambda d: d.name, result.docs))
    return chromosomes
