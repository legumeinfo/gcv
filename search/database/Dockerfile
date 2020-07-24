FROM python:3.8-alpine3.12

RUN apk add --no-cache \
  py3-hiredis \
  py3-psycopg2 \
  py3-redis

ENV PYTHONPATH=/usr/lib/python3.8/site-packages

RUN pip install --no-cache-dir redisearch==1.0.0

WORKDIR /app

COPY *.py .

ENTRYPOINT ["python3", "chado_to_redisearch.py"]
