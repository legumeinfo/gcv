# dependencies
import redis


def connectToRedis(host='localhost', port=6379, db=0, password=''):
  # connect to database
  pool = redis.ConnectionPool(host=host, port=port, db=db, password=password)
  connection = redis.Redis(connection_pool=pool)
  # ping to force connection, preventing errors downstream
  connection.ping()
  return connection
