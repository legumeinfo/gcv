# dependencies
import aiohttp_cors
from aiohttp import web


def parseInt(int_str):
  try:
    i = int(float(int_str))
    assert(i >= 0)
    return i
  except:
    return 0


async def http_get_handler(request):
  # parse the query from the URL query string parameters
  chromosome = request.rel_url.query.get('chromosome', '')
  start = parseInt(request.rel_url.query.get('start'))
  stop = parseInt(request.rel_url.query.get('stop'))
  if start > stop:
    start, stop = stop, start
  handler = request.app['handler']
  region = await handler.process(chromosome, start, stop)
  if region is None:
    return web.HTTPNotFound(text='Region not found')
  return web.json_response({'region': region})


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
  route = app.router.add_get('/chromosome-region', http_get_handler)
  cors.add(route)
  # run the app
  runner = web.AppRunner(app)
  await runner.setup()
  site = web.TCPSite(runner, host, port)
  await site.start()
  # TODO: what about teardown? runner.cleanup()
