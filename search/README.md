# Genome Context Viewer search

As part of our transition of the GCV server from a Django monolith to a [microservices](https://microservices.io/) architecture, all new server features are being implemented as microservices.
This directory contains the first of those features - microservices that support the GCV client's fuzzy search functionality (introduced in release v2.1.0).

Currently the microservices are intended to be run in conjunction with the reference server implementation, which is built on [Chado](http://gmod.org/wiki/Chado_-_Getting_Started).
As such, loading data from Chado is currently the only supported method for loading data; see the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Configuring-and-Loading-Chado) for details.

## Loading the database and running the microservices

Setting up and orchestrating the microservices manually is a tedious task.
We recommend using Docker, which is described in this repository's `README.md` file.

Instructions on how to manually setup and load data into the search database are in the `database/` directory.
Instructions on how to setup run the search microservices are in the `microservices/` directory.
