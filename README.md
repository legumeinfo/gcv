# Genomic Context Viewer
The Genomic Context Viewer (GCV) is a web-app that visualizes genomic context data provided by third party services.
Specifically, it uses gene family assignment as a unit of search and comparison.
By adopting a common set of gene families, data-store operators can deploy federated instances of GCV.

This repository contains GCV itself (the client) and a basic server that demonstrates how the RESTful API GCV depends on can be implemented. 

**User docs, the services API, and non-legume examples are available in the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki).**

## Running GCV
GCV is a standalone web-app that can be run locally on a personal computer or integrated into a website.
To run GCV, locally or as part of a website, you must first compile the program usingg [npm](https://www.npmjs.com/):

    $ cd client
    client/ $ npm install
    client/ $ npm run build
    
This will create an `index.html` in the `client/dist/` directory.
Open this file in a web-browser to run GCV locally, or configure your site to serve it as a static page.

By default, GCV retrieves data from the [Legume Information System](http://legumeinfo.org/home).
See the wiki for more information on how to retrieve data from other sources, and for instructions on general use.

## Running the Server
The example server is implemented in Python 2.7 with [Django 1.11.12](https://www.djangoproject.com/).
The easiest way to run the server locally is to create a [Python Virtual Environment](http://docs.python-guide.org/en/latest/dev/virtualenvs/).
Once Python virtual environments is installed, you can create a virtual environment as follows

    $ virtualenv -p /usr/bin/python2.7 venv

You can then activate the environment

    $ . ./venv/bin/activate

All the server's dependencies are listed in the `requirements.txt` file, which can be used to bootstrap the virtual environment as follows

    $ . ./venv/bin/activate
    (venv) $ cd server/
    server/ (venv) $ pip install -r requirements.txt

The server is designed to use a PostgreSQL database configured with an extended version of the [Chado schema](http://gmod.org/wiki/Chado_-_Getting_Started).
See the wiki for details on the necessary extensions and data loading procedures.

Lastly, the server loads the database credentials and the [Django secret key](https://docs.djangoproject.com/en/1.9/ref/settings/#std:setting-SECRET_KEY) from environment variables: `PGNAME`, `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `SECRET_KEY` .

Once configured, the server can be run **locally** as follows

    server/ (venv) $ python manage.py runserver

This command should only be used for running a local instance of the server.
See the [Django docs](https://docs.djangoproject.com/es/1.9/howto/deployment/) for deployment options.
By default, GCV is configured to retrieve data from the [Legume Information System](http://legumeinfo.org/home).
See the wiki for information on how to retrieve data from your own instance of the server.
