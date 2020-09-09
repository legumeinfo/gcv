# Genome Context Viewer search microservices

This directory contains the microservices that support the fuzzy search functionality of the GCV client.
Specifically, each subdirectory contains a single microservice.

## Setting up and running the microservices

Setting up and orchestrating the microservices manually is a tedious task.
We recommend using Docker, which is described in this repository's `README.md` file.

Instructions on how to setup and run each microservice are in the microservices' respective directories.
All the microservices assume that the Redis database they depend on has already been setup, as descibed in the `../database/README.md` file.
