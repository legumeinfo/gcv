# GCV: Genome Context Viewer

![Genome Context Viewer screenshot](/doc/img/screenshot.png)

The Genome Context Viewer (GCV) is a web-app that visualizes genomic context data provided by third party services.
Specifically, it uses functional annotations as a unit of search and comparison.
By adopting a common set of annotations, data-store operators can deploy federated instances of GCV, allowing users to compare genomes from different providers in a single interface.

This repository contains GCV itself -- the user interface implemented as a web-app.
The backend is implemented as microservices, which are available via the Legume Information System's [microservices repository](https://github.com/legumeinfo/microservices).

**User docs, developer docs, and non-legume examples are available in the [Wiki](https://github.com/legumeinfo/gcv/wiki).**

**See the Legume Information System's instance of the GCV for a live example:** [https://gcv.legumeinfo.org/](https://gcv.legumeinfo.org/)


## GCV Features

The primary function of GCV is searching for and comparing micro-syntenic regions of genomes based on their functional annotation content.
These regions are drawn as "beads-on-a-string", or _tracks_, in the micro-synteny viewer.
This viewer is supplemented with other viewers, namely, pairwise gene-loci dot plots of track genes and pairwise macro-synteny blocks.
Like micro-synteny tracks, macro-synteny blocks are computed on demand with an [MCScanX](https://doi.org/10.1093/nar/gkr1293) style algorithm using functional annotations to define homology relationships between genes.
These blocks can be drawn in a reference style viewer or an all-pairs Circos style viewer.

In general, GCV is intended for comparative and pangenomic analyses.
See the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/User-Help) for a thorough description of GCV features, algorithms, and parameters.


## Running GCV

**Due to the complexity of the microservices implementation, we recommend running GCV and the microservices via Docker Compose.
All the files necessary for running GCV and its microservices via Docker Compose can be found in the [gcv-docker-compose repository](https://github.com/legumeinfo/gcv-docker-compose).**
Not only will this ensure that the microservices and their environment are properly configured, it will also ensure that the correct versions of the microservices are running.
Users that wish to run the microservices manually should refer to the services' respective directories in the [microservices repository](https://github.com/legumeinfo/microservices).

The following instructions describe how to run GCV itself via Docker or locally.
GCV is developed as part of the [Legume Information System](https://legumeinfo.org/) and [Legume Federation](https://www.legumefederation.org/) projects.
As such, it is [configured](https://github.com/legumeinfo/gcv/wiki/Client-Configuration) by default to consume genomes from these providers.
See [Configuration](#configuration) for instructions on how to tune GCV for your site.

### Docker

The GCV `Dockerfile` is a [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/) with four stages: `base`, `dev`, `build`, and `prod`.
In order for your image to behave correctly you must specify one of these stages when building GCV with Docker:
```console
docker build --target [base|dev|build|prod] .
```
This will build an image called `gcv` that you can then run as follows:
```console
docker run gcv
```

The following is a description of each build stage and how you may configure them during the build and run steps.

#### `base`
This stage copies GCV into the container and installs all of its dependencies.
We recommend only using this stage to produce base images.

#### `dev`
This stage continues from the `base` stage and starts the [Angular development server](#development-server) and exposes the server on port `4200`.
Since this is a development server, we recommend mounting your local copy of the GCV repository as a volume when running the container so the development server is monitoring your code instead of the code in the container!
```console
cd gcv/
docker run -v .:/gcv gcv
```

#### `build`
This stage continues from the `base` stage and builds GCV for use in production.
However, a production server is not provided in this stage.
We reccomend only using this stage to propduce a produciton base image if you want to serve GCV using a server other than the one provided by the `prod` stage.

Options can be provided directly to the [Angular `build` command](https://angular.io/cli/build) via the `ANGULAR_BUILD_OPTIONS` argument.
For example:
```console
docker build --target build --build-arg ANGULAR_BUILD_OPTIONS=--verbose .
```

#### `prod`
This stage continues from the `build` stage and starts an [NGINX server](https://nginx.org/en/) and exposes the server on port 80.
This stage copies the NGINX config template file in the the `nginx/templates/` directory into the image, which you can modify prior to building the image.
This template file can also be overridden at run-time by mounting local template file as a volume when running the container:
```console
docker run -v nginx/templates/default.conf.template:/etc/nginx/template/ gcv
```
Note that the provided template file that the image is built with uses a `GCV_PATH` environment variable to set the path GCV is served at.
This means you can change the path GCV is served at at run-time as follows:
```console
docker run -e GCV_PATH=/my/gcv/path/ gcv
```
Note: a trailing slash is required if the path has more than one part.

Lastly, you don't have to rebuild the GCV `prod` image if you want to update GCV's configuration.
Instead, you can mount an updated [configuration file](#configuration) as a volume when you run the container:
```
docker run -v ./config.json:/usr/share/nginx/html/config/config.json gcv
```


### Locally

#### Setup

The client's dependencies can be installed via [npm](https://www.npmjs.com/):
```console
npm install
npm install --save-dev
```

#### Development server

For local development and testing, the client can be run via a dev server as follows:
```console
ng serve
```

The client can then be reached at [http://localhost:4200/](http://localhost:4200/).
When running the dev server, the app will automatically reload if you change any of the source files.

#### Build

To host the client as part of a website, it must first be built:
```console
ng build
```

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

GCV is also on Zenodo if you want to cite a specific version of the software: https://doi.org/10.5281/zenodo.6823352
