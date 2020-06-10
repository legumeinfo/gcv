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

## Installing Search
The microservice is implemented in Python 3.
The easiest way to run the microservice locally is with a [Python Virtual Environment](http://docs.python-guide.org/en/latest/dev/virtualenvs/).
Once Python virtual environments is installed, you can create a virtual environment as follows

    $ virtualenv venv

You can then activate the environment

    $ . ./venv/bin/activate

All the microservice's dependencies are listed in the `search/requirements.txt` file, which can be used to bootstrap the virtual environment as follows

    $ . ./venv/bin/activate
    (venv) $ cd search/
    search/ (venv) $ pip install -r requirements.txt

## Loading Data
As mentioned prior, currently the microservice can only load data from a PostgreSQL database configured with the [Chado schema](http://gmod.org/wiki/Chado_-_Getting_Started).
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Configuring-and-Loading-Chado) for details on data loading procedures. 

The `chado_to_redisearh.py` script is the program that actually loads data from Chado into RediSearch.
It can be run as follows

    search (venv) $ ./chado_to_redisearch.py

By default, it uses the default PostgreSQL and Redis credentials.
Use the `--help` flag to see how to enter other credentials if necessary.
