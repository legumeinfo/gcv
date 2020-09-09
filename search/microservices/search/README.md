# Genome Context Viewer search microservice

This directory contains the search microservice.
This microservice takes a query and returns gene names and chromosome regions that are similar to the given query.

## Setup

The easiest way to run the microservice is with a [Python Virtual Environment](http://docs.python-guide.org/en/latest/dev/virtualenvs/).
Once Python virtual environments is installed, you can create a virtual environment as follows

    $ virtualenv venv

All the microservice's dependencies are listed in the `requirements.txt` file, which can be used to bootstrap the virtual environment as follows

    $ . ./venv/bin/activate
    (venv) $ pip install -r requirements.txt

This microservice depends on the gene search, chromosome search, and chromosome region microservices.
These services must be running and reachable via gRPC in order for the search microservice to function correctly.
See the `../gene_search/`, `../chromosome_search/`, and `../chromosome_region/` directories for instructions on setting up and running these microservices.

## Running

The microservice hosts an HTTP and a gRPC server.
The credentials for the servers can be set via command line flags or via environment variables.
The HTTP server credentials can be provided via the `HTTP_HOST` and `HTTP_PORT` environment variables.
And the gRPC server credentials can be provided via the `GRPC_HOST` and `GRPC_PORT` environment variables.

Additionally, the microservice relies on the gene search, chromosome search, and chromosome region microservices to function correctly.
These credentials can also be set via command line flags or via environment variables.
The credentials for the gene search microservice can be set via the `GENEADDR` environment variable.
The credentials for the chromosome search microservice can be set via the `CHROMOSOMEADDR` environment variable.
And the credentials for the chromosome region microservice can be set via the `REGIONADDR` environment variable.

Run the microservice as follows

    (venv) $ ./microservice.py

For more information about the microservice, run

    (venv) $ ./microservice.py --help

## Use

The microservice can be queried via HTTP GET or gRPC.
The query is a string that can contain one or more space separated genes that meet the following regular expression

    [gene:]<GENE_NAME>

and/or one or more space separated regions that meet the following regular expression

    [region:]<CHROMOSOME_NAME>(':'|' ')<START_POSITION>('-'|'..')<END_POSITION>

The following is an example HTTP GET URL

    localhost:8080/search?q=genename%20chromosomename:423487..9873246

See the `search.proto` file and its auto-generated stubs for gRPC requests.
