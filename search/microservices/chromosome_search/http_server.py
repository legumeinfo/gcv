# dependencies
import aiohttp_cors
from aiohttp import web


async def http_get_handler(request):
  # parse the query from the URL query string parameters
  query = request.rel_url.query.get('q', '')
  handler = request.app['handler']
  chromosomes = await handler.process(query)
  return web.json_response(chromosomes)


async def run_http_server(host, port, handler):
  # make the app
  app = web.Application()
  app['handler'] = handler
  # define the route and enable CORS
  cors = aiohttp_cors.setup(app, defaults={
    '*': aiohttp_cors.ResourceOptions(
           allow_credentials=True,
           expose_headers='*',
           allow_headers='*',
         )
  })
  route = app.router.add_get('/chromosome-search', http_get_handler)
  cors.add(route)
  # run the app
  runner = web.AppRunner(app)
  await runner.setup()
  site = web.TCPSite(runner, host, port)
  await site.start()
  # TODO: what about teardown? runner.cleanup()
