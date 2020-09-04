FROM python:3.8-alpine3.12 AS builder

RUN apk add --no-cache \
  gcc \
  musl-dev \
  postgresql-dev

COPY requirements.txt .

RUN pip3 install --no-cache-dir -r requirements.txt

FROM python:3.8-alpine3.12

RUN apk add --no-cache libpq

COPY --from=builder /usr/local/lib/python3.8/site-packages/ /usr/local/lib/python3.8/site-packages/

WORKDIR /app

COPY *.py ./

ENTRYPOINT ["python3", "chado_to_redisearch.py"]
