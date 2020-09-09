# Genome Context Viewer client

The GCV user interface (client) is implemented as a federated single page [Angular](https://angular.io/) web app.
The client is federated because it does not necessarily consume data from the same server that hosts it, but rather, the client can be configured to consume data from multiple arbitrary hosts that provide access to their data via the GCV [services API](https://github.com/legumeinfo/lis_context_viewer/wiki/Services-API-v2).

## Setup

The client's dependencies can be installed via [npm](https://www.npmjs.com/):

    $ npm install
    $ npm install --save-dev

## Development server

For local development and testing, the client can be run via a dev server as follows

    $ ng serve

The client can then be reached at [http://localhost:4200/](http://localhost:4200/).
When running the dev server, the app will automatically reload if you change any of the source files.

## Build

To host the client as part of a website, it must first be built

    $ ng build

The build artifacts will be stored in the `dist/` directory.
Use the `--prod` flag for a production build.

You can verify the build by running it locally via the [angular-http-server](https://www.npmjs.com/package/angular-http-server).
See the Angular docs for a discussion on production deployment options: [https://angular.io/guide/deployment](https://angular.io/guide/deployment).

## Configuration

The client can be extensively configured via the `src/config/config.json` file (`dist/config/config.json` for production).
This file is loaded dynamically when the client starts, meaning the client does not have to be recompiled when changes are made to the file; the app simply has to be reloaded in your web browser.
See the [Wiki](https://github.com/legumeinfo/lis_context_viewer/wiki/Client-Configuration) for details about the contents of the client configuration file.
