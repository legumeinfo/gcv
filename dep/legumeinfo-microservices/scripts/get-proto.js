#!/usr/bin/env node
/**
 * Gets each microservice's .proto files from GitHub.
 */

'use strict';

const degit = require('degit');
const path = require('path');

// the microservices live in a monorepo
const repo = 'legumeinfo/microservices'

// each microservice's .proto files are fetched individually
const microservices = [
  // user/repo/subdirectory#(branch|release tag|commit hash)
  `${repo}/chromosome/proto#main`,
  `${repo}/chromosome_region/proto#main`,
  `${repo}/chromosome_search/proto#main`,
  `${repo}/genes/proto#main`,
  `${repo}/gene_search/proto#main`,
  `${repo}/macro_synteny_blocks/proto#main`,
  `${repo}/micro_synteny_search/proto#main`,
  `${repo}/pairwise_macro_synteny_blocks/proto#main`,
  `${repo}/search/proto#main`,
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
