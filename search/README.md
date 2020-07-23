# Search
This directory contains [microservices](https://microservices.io/) that support the search functionality of the GCV client.
The microservices are implemented with [RediSearch](https://oss.redislabs.com/redisearch/).

Currently the microservices are intended to be run in conjunction with the reference server implementation, which is built on [Chado](http://gmod.org/wiki/Chado_-_Getting_Started).
As such, loading data from Chado is currently the only supported method for loading data; see the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Configuring-and-Loading-Chado) for details.

## The Database
The microservices are implemented with RediSearch [Redis](https://redis.io/) module.
The following describes how to setup Redis with RediSearch and load data from Chado.

### Setting up RediSearch
RediSearch is a module for Redis.
It can [installed locally or run via Docker](https://oss.redislabs.com/redisearch/Quick_Start/).
When running with Docker, we recommend mounting a volume to ensure any data loaded persists when the container is stopped.

    $ docker run -d -p 6379:6379 -v /host/path/to/save/data/to:/data redislabs/redisearch:latest

### Loading Data
As mentioned prior, currently data can only be loaded from a PostgreSQL database configured with the [Chado schema](http://gmod.org/wiki/Chado_-_Getting_Started).
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Configuring-and-Loading-Chado) for details on data loading procedures. 

The `database/chado_to_redisearh.py` script is the program that actually loads data from Chado into RediSearch.
The easiest way to run the script is with a [Python Virtual Environment](http://docs.python-guide.org/en/latest/dev/virtualenvs/).
Prepare to run the script as follows

    $ cd database
    database $ virtualenv venv
    database $ . ./venv/bin/activate
    database (venv) $ pip install -r requirements.txt

Data can then be loaded as follows

    database (venv) $ ./chado_to_redisearch.py

By default, it uses the default PostgreSQL and Redis credentials.
Use the `--help` flag to see how to enter other credentials if necessary.

## Microservices
The search microservices live in the `microservices/` directory.
Specifically, each subdirectory corresponds to a different microservice.
Currently all the microservices are implemented in Python 3, though this is subject to change based on program requirements and programmer preferences.
The microservices can be installed in a manner similar to the loading script.
Due to the number of services and the configuration required to facilitate inter-service communication, we recommend waiting until we containerize the services and orchestrate them with Docker Compose/
