import psycopg2
import redis


def connectToChado(database, user, password=None, host=None, port=None):
  db_string = 'dbname=' + database + ' user=' + user
  if password is not None:
    db_string += ' password=' + password
  if host is not None:
    db_string += ' host=' + host
  if port is not None:
    db_string += ' port=' + str(port)
  return psycopg2.connect(db_string)


def connectToRedis(host='localhost', port=6379, db=0, password=''):
  pool = redis.ConnectionPool(host=host, port=port, db=db, password=password)
  connection = redis.Redis(connection_pool=pool)
  # ping to force connection, preventing errors downstream
  connection.ping()
  return connection
