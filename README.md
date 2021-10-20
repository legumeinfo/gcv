# GCV: Genome Context Viewer

![Genome Context Viewer screenshot](/doc/img/screenshot.png)

The Genome Context Viewer (GCV) is a web-app that visualizes genomic context data provided by third party services.
Specifically, it uses functional annotations as a unit of search and comparison.
By adopting a common set of annotations, data-store operators can deploy federated instances of GCV, allowing users to compare genomes from different providers in a single interface.

This repository contains GCV itself -- the user interface implemented as a web-app.
The backend is implemented as microservices, which are available via the Legume Information System's [microservices repository](https://github.com/legumeinfo/microservices).

**User docs, developer docs, and non-legume examples are available in the [wiki](https://github.com/legumeinfo/gcv/wiki).**

**See the Legume Information System's instance of the GCV for a live example:** [https://legumeinfo.org/gcv2](https://legumeinfo.org/gcv2)


## GCV Features

The primary function of GCV is searching for and comparing micro-syntenic regions of genomes based on their functional annotation content.
These regions are drawn as "beads-on-a-string", or _tracks_, in the micro-synteny viewer.
This viewer is supplemented with other viewers, namely, pairwise gene-loci dot plots of track genes and pairwise macro-synteny blocks.
Like micro-synteny tracks, macro-synteny blocks are computed on demand with an [MCScanX](https://doi.org/10.1093/nar/gkr1293) style algorithm using functional annotations to define homology relationships between genes.
These blocks can be drawn in a reference style viewer or an all-pairs Circos style viewer.

In general, GCV is intended for comparative and pangenomic analyses.
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/User-Help) for a thorough description of GCV features, algorithms, and parameters.


## Running GCV

Due to the complexity of the microservices implementation, we recommend running the backend via the Docker Compose files: `compose[.prod].yml`.
Not only will this ensure that the microservices and their environment are properly configured, it will also ensure that the correct versions of the microservices are running.
Users that wish to run the microservices manually should refer to the services' respective directories in the Legume Information System's [microservices repository](https://github.com/legumeinfo/microservices).

The following instructions describe how to run GCV itself via Docker or locally for development.
GCV is developed as part of the [Legume Information System](https://legumeinfo.org/) and [Legume Federation](https://www.legumefederation.org/) projects.
As such, it is [configured](https://github.com/legumeinfo/gcv/wiki/Client-Configuration) by default to consume genomes from these providers.
See the Configuration section for instructions on how to tune GCV for your site.

### Docker

Issue the command `docker compose up -d` to start a [development server](#development-server).

For a production deployment, optionally create a `.env` file that sets the following environment variables:

```
# sub-URI that GCV client will be accessible from defaults to "/"
CLIENT_SUB_URI=/gcv-client/
# TCP port that the GCV client HTTP server will be exposed on
CLIENT_PORT=8080            # defaults to 80
# defaults to http://localhost/gcv/
MICROSERVICES_BASE_URL=http://localhost:9999/gcv/
```

Then issue the command `docker compose -f compose.prod.yml up -d`.

In the example above, the GCV client application would be accessible from http://<hostname>/gcv-client/ (including http://localhost/gcv-client/), while [GCV microservices](https://github.com/legumeinfo/microservices) backend is to be accessible from http://localhost:9999/gcv/.

### Locally

#### Setup

The client's dependencies can be installed via [npm](https://www.npmjs.com/):

    $ npm install
    $ npm install --save-dev

#### Development server

For local development and testing, the client can be run via a dev server as follows

    $ ng serve

The client can then be reached at [http://localhost:4200/](http://localhost:4200/).
When running the dev server, the app will automatically reload if you change any of the source files.

#### Build

To host the client as part of a website, it must first be built

    $ ng build

The build artifacts will be stored in the `dist/` directory.

You can verify the build by running it locally via the [angular-http-server](https://www.npmjs.com/package/angular-http-server).
See the Angular docs for a discussion on production deployment options: [https://angular.io/guide/deployment](https://angular.io/guide/deployment).

#### Configuration

The client can be extensively configured via the `src/config/config.json` file (`dist/config/config.json` for production).
This file is loaded dynamically when the client starts, meaning the client does not have to be recompiled when changes are made to the file; the app simply has to be reloaded in your web browser.
See the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Client-Configuration) for details about the contents of the client configuration file.

## Citation
If you used an instance of GCV in your work or deployed it as part of you site, please consider citing the manuscript to help support maintenance and further development:

Cleary, Alan, and Andrew Farmer. "Genome Context Viewer: visual exploration of multiple annotated genomes using microsynteny." _Bioinformatics_, Volume 34, Issue 9, 01 May 2018, Pages 1562&ndash;1564, [https://doi.org/10.1093/bioinformatics/btx757](https://doi.org/10.1093/bioinformatics/btx757).
