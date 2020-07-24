FROM alpine:3.12

RUN apk add --no-cache py3-psycopg2 py3-redis

COPY chado_to_redisearch.py /usr/local/bin

ENTRYPOINT ["python3", "/usr/local/bin/chado_to_redisearch.py"]
