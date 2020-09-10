# GCV: Genome Context Viewer

![Genome Context Viewer screenshot](/doc/img/screenshot.png)

The Genome Context Viewer (GCV) is a web-app that visualizes genomic context data provided by third party services.
Specifically, it uses functional annotations as a unit of search and comparison.
By adopting a common set of annotations, data-store operators can deploy federated instances of GCV, allowing users to compare genomes from different providers in a single interface.

This repository contains GCV itself (the client) and a server that can be used to provide data to the client, though the client can consume data form any server that implements the GCV [services API](https://github.com/legumeinfo/lis_context_viewer/wiki/Services-API-v2).
GCV is developed as part of the [Legume Information System](https://legumeinfo.org/) and [Legume Federation](https://www.legumefederation.org/) projects.
As such, it is [configured](https://github.com/legumeinfo/lis_context_viewer/wiki/Client-Configuration) by default to consume genomes from these providers.

**User docs, developer docs, and non-legume examples are available in the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki).**

**See the Legume Information System's instance of the GCV for a live example:** [https://legumeinfo.org/lis_context_viewer](https://legumeinfo.org/lis_context_viewer)


## GCV Features

The primary function of GCV is searching for and comparing micro-syntenic regions of genomes based on their functional annotation content.
These regions are drawn as "beads-on-a-string", or _tracks_, in the micro-synteny viewer.
This viewer is supplemented with other viewers, namely, pairwise gene-loci dot plots of track genes and pairwise macro-synteny blocks.
Like micro-synteny tracks, macro-synteny blocks are computed on demand with an [MCScanX](https://doi.org/10.1093/nar/gkr1293) style algorithm using functional annotations to define homology relationships between genes.
These blocks can be drawn in a reference style viewer or an all-pairs Circos style viewer.

In general, GCV is intended for comparative and pangenomic analyses.
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/User-Help) for a thorough description of the GCV features, algorithms, and parameters.


## Running GCV

GCV is composed a three major parts: the user interface (`client/`), the original server (`server/`), and a new microservices architecture (`search/`) we are in the process of transitioning the server to.
Note, since we are in the process of transitioning the server to the microservices architecture, currently both the server and the microservices must be run together to fully support the client.
We recommend running these programs via Docker.
Use the instructions below to run all three parts via Docker compose.
If you wish to run a subset of the programs, we advise either modifying the Docker compose files or running the programs via their individual Docker files located in their respective directories.

If you would rather install and run the programs yourself, visit each program's directory for instructions on how to do so.

### Docker

The easiest way to run GCV (and its server) is via [Docker](https://www.docker.com/), as documented below.
See the `client/`, `server/`, and `search/` directories for instructions on installing and running GCV without containers.

Two Docker Compose files allow GCV to be built and run in developer mode (`docker-compose.yml`) or production mode (`docker-compose.prod.yml`).

Both modes assume a suitable PostgreSQL dump (optionally compressed) containing a Chado schema has been places in the directory `./db/docker-entrypoint-initdb.d/`.

#### Developer mode

    docker-compose up --build --detach

`client/src` is bind mounted in the client container and served from http://localhost:4200 via `ng serve`.

`server/` is bind mounted in the server container, and the service API is accessible from http://localhost:8000/services.

Changes to files in `client/src` and `server/` will be reflected immediately.

#### Production mode

First set the environment variables `SECRET_KEY` and `POSTGRES_PASSWORD` (and optionally `GCV_PORT` to have the client service listen on a port other than 80, and `GCV_SUB_URI` to serve the client from a URL path other than the default "/"; e.g., "/gcv/") either in a [.env file](https://docs.docker.com/compose/environment-variables/#the-env-file), or in the environment in which the `docker-compose` command is run.

    docker-compose -f docker-compose.prod.yml up --build --detach

From the host running the Docker Engine, the client UI is available at http://localhost (or http://localhost${GCV_SUB_URI}), while the services API can be accessed at http://localhost/services (or http://localhost${GCV_SUB_URI}services)

## Citation
If you used an instance of GCV in your work or deployed it as part of you site, please consider citing the manuscript to help support maintenance and further development:

Cleary, Alan, and Andrew Farmer. "Genome Context Viewer: visual exploration of multiple annotated genomes using microsynteny." _Bioinformatics_, Volume 34, Issue 9, 01 May 2018, Pages 1562&ndash;1564, [https://doi.org/10.1093/bioinformatics/btx757](https://doi.org/10.1093/bioinformatics/btx757).
