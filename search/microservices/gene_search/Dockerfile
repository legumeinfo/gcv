FROM alpine:3.12 AS base

# grpcio takes a long time to build; using packages where possible for now
RUN apk add --no-cache \
  py3-aiohttp-cors \
  py3-grpcio \
  py3-hiredis \
  py3-protobuf \
  py3-redis

FROM base AS builder

RUN apk add --no-cache py3-pip

RUN pip3 install --no-cache-dir redisearch==1.0.0

FROM base

COPY --from=builder /usr/lib/python3.8/site-packages/ /usr/lib/python3.8/site-packages

WORKDIR /app

COPY . .

ENTRYPOINT ["python3", "microservice.py"]
