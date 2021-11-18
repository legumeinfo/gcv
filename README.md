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

Due to the complexity of the microservices implementation, we recommend running the backend via the provided Docker Compose files: `microservices/compose[.prod].yml`.
Not only will this ensure that the microservices and their environment are properly configured, it will also ensure that the correct versions of the microservices are running.
Users that wish to run the microservices manually should refer to the services' respective directories in the Legume Information System's [microservices repository](https://github.com/legumeinfo/microservices).

The following instructions describe how to run GCV itself via Docker or locally.
GCV is developed as part of the [Legume Information System](https://legumeinfo.org/) and [Legume Federation](https://www.legumefederation.org/) projects.
As such, it is [configured](https://github.com/legumeinfo/gcv/wiki/Client-Configuration) by default to consume genomes from these providers.
See [Configuration](#configuration) for instructions on how to tune GCV for your site.

### Docker

The GCV `Dockerfile` is a multi-stage build with four stages: `base`, `dev, `build`, and `prod`.
`base` installs the libraries and dependencies necessary for building GCV and running the development server.
`dev` continues from the `base` stage and starts a development server, which runs on port 4200 by default.
`build` continues from the `base` stage and builds the app for use in production.
And `prod` continues from the `build` stage and starts a production server, which runs on port 80 by default.
We recommend using the provided `compose.(dev|build-prod|prod).yml` files, as described below.

`compose.dev.yml` is intended for local development:
```bash
$ docker compose -f compose.dev.yml up -d
```
It builds a Docker image using the `dev` stage of the `Dockerfile` and starts a container that runs the [Angular development server](#development-server).
The `src/` directory is mounted as a volumn in the container so any changes to the code on the host machine will be noticed by the development server running in the container.
Command-line aguments can be passed to the Angular development server using the `command` property of the `gcv` service in `compose.dev.yml`.
For example, the Angular development server runs on port 4200 by default.
This can be changed using the command property (exposing the new port is also required):
```yml
  gcv:
    ...
    command: --port 1234
    ports:
      - "1234:1234"
    expose:
      - 1234
    ...
```

`compose.build-prod.yml` is intended for building a local copy of GCV for production:
```bash
$ docker compose -f compose.build-prod.yml up -d
```
It builds a Docker image using the `prod` stage of the `Dockerfile` and starts a container that serves GCV using [NGINX](https://www.nginx.com/).
The `src/` directory is mounted as a volumn in the container so any local changes to the code will be included when the image is built.
Command-line aguments can be passed to the Angular build process when the Docker image is built using the `ANGULAR_BUILD_OPTIONS` variable in the `args` property of the `gcv` service in `compose.build-prod.yml`.
For example, more verbose logging by Angular can be enabled as follows:
```yml
  gcv:
    ...
    args:
      ANGULAR_BUILD_OPTIONS --verbose
    ...
```
Note, the Angular [base tag](https://angular.io/guide/deployment#the-base-tag) can be set using this method.
However, building the Docker image is not necessary to change this value, as described below.

`compose.prod.yml` is intended for running a pre-built GCV image in production:
```bash
$ docker compose -f compose.prod.yml up -d
```
It downloads a pre-built Docker image (built using the `prod` stage of the `Dockerfile`) and starts a container that serves GCV using NGINX.
Although the image is pre-built, the GCV app and how it is served are still configurable to some extent.

GCV can be configured at run-time using a `config.json` file (see [Configuration](#configuration) for details).
The `config.json` file provided with the source code is included with the pre-build image, however, it can be overridden by mounting it as a volume in the container:
```yml
  gcv:
    ...
    volumes:
      - ./config.json:/usr/share/nginx/html/config/config.json
    ...
```
The NGINX server can be configured using a `*.config` file.
The `nginx/default.config` file provided with the source code is included with the pre-built image.
As with the `config.json` file, the `nginx/default.config` file can be overridden by mounting it as a volume in the container:
```yml
  gcv:
    ...
    volumes:
      - ./nginx/default.config:/etc/nginx/conf.d/default.config
    ...
```
The official NGINX Docker image that the GCV `Dockerfile` uses as a base image for the `prod` build stage comes loaded with the [`ngx_http_sub_module`](https://nginx.org/en/docs/http/ngx_http_sub_module.html) module.
This means that the `nginx/default.config` file may be configured to replace strings in responses sent by NGINX.
For example, the `build` stage in the `Dockerfile` uses the default Angular base tag -- `/` -- but the `nginx/default.config` file that the `prod` stage loads changes this to `/gcv` at run-time using `ngx_http_sub_module`:
```conf
server {

    ...

    location / {
        ...
        sub_filter '<base href="/">' '<base href="/gcv">';
        sub_filter_once on;
        ...
    }

}
```


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
