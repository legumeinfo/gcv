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
  `${repo}/chromosome/proto`,
  `${repo}/chromosome_region/proto`,
  `${repo}/chromosome_search/proto`,
  `${repo}/genes/proto`,
  `${repo}/gene_search/proto`,
  `${repo}/macro_synteny_blocks/proto`,
  `${repo}/micro_synteny_search/proto`,
  `${repo}/pairwise_macro_synteny_blocks/proto`,
  `${repo}/search/proto`,
];

// where the files will be saved
const destination = path.resolve('./proto');

// degit options
const options = {cache: false, force: true, verbose: false};

microservices.forEach((src) => {
  const emitter = degit(src, options);
  
  emitter.on('info', info => {
  	console.log(info.message);
  });
  
  emitter.clone(destination).then(() => {
  	console.log('done');
  });
});
