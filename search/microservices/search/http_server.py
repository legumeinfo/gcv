# dependencies
import aiohttp_cors
from aiohttp import web


async def http_get_handler(request):
  handler = request.app['handler']
  # parse the query from the URL query string parameters
  query = request.rel_url.query.get('q', '')
  results = await handler.process(query)
  return web.json_response(results)


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
  route = app.router.add_get('/search', http_get_handler)
  cors.add(route)
  # run the app
  runner = web.AppRunner(app)
  await runner.setup()
  site = web.TCPSite(runner, host, port)
  await site.start()
  # TODO: what about teardown? runner.cleanup()
