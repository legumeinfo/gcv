#!/usr/bin/env node
/**
 * Gets each microservice's .proto files from GitHub.
 */

'use strict';

const degit = require('tiged');
const path = require('path');

// the microservices live in a monorepo
const repo = 'legumeinfo/microservices'

// each microservice's .proto files are fetched individually
const microservices = [
  // user/repo/subdirectory#(branch|release tag|commit hash)
  `${repo}/chromosome/proto#chromosome@v1.0.0`,
  `${repo}/chromosome_region/proto#chromosome_region@v1.0.0`,
  `${repo}/chromosome_search/proto#chromosome_search@v1.0.0`,
  `${repo}/genes/proto#genes@v1.0.0`,
  `${repo}/gene_search/proto#gene_search@v1.0.0`,
  `${repo}/macro_synteny_blocks/proto#macro_synteny_blocks@v1.0.0`,
  `${repo}/micro_synteny_search/proto#micro_synteny_search@v1.0.0`,
  `${repo}/pairwise_macro_synteny_blocks/proto#pairwise_macro_synteny_blocks@v1.0.0`,
  `${repo}/search/proto#search@v1.0.0`,
];

// where the files will be saved
const destination = path.resolve('./proto');

// degit options
const options = {cache: false, force: true, verbose: false};

let promise = Promise.resolve();
microservices.forEach((src) => {
  // chain async .clone requests so they are made synchronously
  promise = promise.then(() => {
    const emitter = degit(src, options);

    emitter.on('info', info => {
      console.log(info.message);
    });

    emitter.clone(destination).then(() => {
      console.log('done');
    });

    return emitter.clone(destination);
  });

});
