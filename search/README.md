# Search
This directory contains a [microservice](https://microservices.io/) that supports the search functionality of the GCV client.
The microservice is implemented with [RediSearch](https://oss.redislabs.com/redisearch/).

Currently the microservice is intended to be run in conjunction with the reference server implementation, which is built on [Chado](http://gmod.org/wiki/Chado_-_Getting_Started).
As such, it currently only supports loading data from Chado; see the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Configuring-and-Loading-Chado) for details.

## Setting up RediSearch
RediSearch is a plugin for [Redis](https://redis.io/).
It can [installed locally or run via Docker](https://oss.redislabs.com/redisearch/Quick_Start/).
When running with Docker, we recommend mounting a volume to ensure any data loaded persists when the container is stopped.

    $ docker run -d -p 6379:6379 -v /host/path/to/save/data/to:/data redislabs/redisearch:latest
