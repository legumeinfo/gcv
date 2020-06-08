![Genome Context Viewer screenshot](/doc/img/screenshot.png)

# Genome Context Viewer
The Genome Context Viewer (GCV) is a web-app that visualizes genomic context data provided by third party services.
Specifically, it uses functional annotations as a unit of search and comparison.
By adopting a common set of annotations, data-store operators can deploy federated instances of GCV, allowing users to compare genomes from different providers in a single interface.

This repository contains GCV itself (the client) and a basic server that demonstrates how the [service API](https://github.com/legumeinfo/lis_context_viewer/wiki/Services-API-v2) GCV depends on can be implemented.
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
GCV is a standalone web-app that can be run locally on a personal computer or integrated into a website.
To run GCV, locally or as part of a website, you must first build the program using [npm](https://www.npmjs.com/):

    $ cd client
    client/ $ npm install
    client/ $ npm run build --prod

If you're going to be serving the client over HTTPS then we suggest compressing the build with [Brotli](https://github.com/google/brotli) for faster load times:

    client/ $ for i in dist/*; do brotli $i; done
    
This will create an `index.html` file in the `client/dist/` directory.
Now you can run GCV locally using a command-line HTTP server, such as [angular-http-server](https://www.npmjs.com/package/angular-http-server), or you can integrate GCV into a website by configuring an HTTP server, such as Apache or NGINX, to serve `index.html` as a static page.

By default, GCV retrieves data from the [Legume Information System](http://legumeinfo.org/home).
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Client-Configuration) for more information on how to retrieve data from other sources, and for instructions on how to configure the client in general.

## Running the Server
The example server is implemented in Python 3 with [Django 3](https://www.djangoproject.com/).
The easiest way to run the server locally is with a [Python Virtual Environment](http://docs.python-guide.org/en/latest/dev/virtualenvs/).
Once Python virtual environments is installed, you can create a virtual environment as follows

    $ virtualenv venv

You can then activate the environment

    $ . ./venv/bin/activate

All the server's dependencies are listed in the `server/requirements.txt` file, which can be used to bootstrap the virtual environment as follows

    $ . ./venv/bin/activate
    (venv) $ cd server/
    server/ (venv) $ pip install -r requirements.txt

The server is designed to use a PostgreSQL database configured with an extended version of the [Chado schema](http://gmod.org/wiki/Chado_-_Getting_Started).
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Configuring-and-Loading-Chado) for details on the necessary extensions and data loading procedures.

Lastly, the server loads the database credentials and the [Django secret key](https://docs.djangoproject.com/en/3.0/ref/settings/#std:setting-SECRET_KEY) from environment variables: `PGNAME`, `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `SECRET_KEY` .

Once configured, the server can be run **locally** as follows

    server/ (venv) $ python manage.py runserver

This command should only be used for running a local instance of the server; the Django development server has no security features and can only serve one request at a time!
See the [Django docs](https://docs.djangoproject.com/es/3.0/howto/deployment/) for deployment options.
By default, GCV is configured to retrieve data from the [Legume Information System](http://legumeinfo.org/home).
See the [wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Client-Configuration) for information on how to retrieve data from your own instance of the server.

## Running GCV (Docker)

Two Docker Compose files allow GCV to be built and run in developer mode (`docker-compose.yml`) or production mode (`docker-compose.prod.yml`).

Both modes assume a suitable PostgreSQL dump (optionally compressed) containing a Chado schema has been places in the directory `./db/docker-entrypoint-initdb.d/`.

### Developer mode

    docker-compose up --build --detach

`client/src` is bind mounted in the client container and served from http://localhost:4200 via `ng serve`.
Changes to files in `client/src` will be reflected immediately.

The service API is accessible from http://localhost:8000/services

### Production mode

First set the environment variables `SECRET_KEY` and `POSTGRES_PASSWORD` either in a [.env file](https://docs.docker.com/compose/environment-variables/#the-env-file), or in the environment in which the `docker-compose` command is run.

    docker-compose -f docker-compose.prod.yml up --build --detach

From the host running the Docker Engine, the client UI is available at http://localhost, while the services API can be accessed at http://localhost/services

## Citation
If you used an instance of GCV in your work or deployed it as part of you site, please consider citing the manuscript to help support maintenance and further development:

Cleary, Alan, and Andrew Farmer. "Genome Context Viewer: visual exploration of multiple annotated genomes using microsynteny." _Bioinformatics_, Volume 34, Issue 9, 01 May 2018, Pages 1562&ndash;1564, [https://doi.org/10.1093/bioinformatics/btx757](https://doi.org/10.1093/bioinformatics/btx757).
