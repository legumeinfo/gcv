#!/usr/bin/env node
/**
 * Gets each microservice's .proto files from GitHub.
 */

'use strict';

const degit = require('tiged');
const path = require('path');

// the microservices live in a monorepo
const repo = 'legumeinfo/microservices'

// each microservice's subdirectory name and version required by GCV
const microservices = [
  {name: 'chromosome', version: '1.1.2'},
  {name: 'chromosome_region', version: '1.1.2'},
  {name: 'chromosome_search', version: '1.1.2'},
  {name: 'genes', version: '1.1.2'},
  {name: 'gene_search', version: '1.1.2'},
  {name: 'macro_synteny_blocks', version: '1.3.2'},
  {name: 'micro_synteny_search', version: '1.1.2'},
  {name: 'pairwise_macro_synteny_blocks', version: '1.3.2'},
  {name: 'search', version: '1.1.2'},
];

// where the files will be saved
const destination = path.resolve('./proto');

// degit options
const options = {disableCache: true, force: true, verbose: false};

// fetch each microservice's .proto files individually
const promises = microservices.map(({name, version}) => {

  // user/repo/subdirectory#(branch|release tag|commit hash)
  const src = `${repo}/${name}/proto#${name}@v${version}`;

  const emitter = degit(src, options);

  emitter.on('info', info => {
    console.log(info.message);
  });

  return emitter.clone(destination);

});

// report when all the files have loaded
Promise.all(promises).then(() => {
  console.log('done');
});
