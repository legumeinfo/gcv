#!/usr/bin/env node
/**
 * Builds the package. See individual scripts for explanations.
 */

'use strict';

const execSync = require('child_process').execSync;

const commands = [
  // prepare for new build
  'npm run clean',
  // get proto files
  './scripts/get-proto.js',
  // build protos in ./src for proper index generation and TypeScript compiling
  './scripts/build-proto.js ./src',
  // create ./src/**/index.ts files (uses legumeinfo-microservices/.ctirc)
  './scripts/create-indexes.js',
  // compile from ./src into ./dist
  'tsc',
  // build protos again in ./dist to override TypeScript's crap .d.ts files
  './scripts/build-proto.js ./dist'
];

commands.forEach((cmd) => {
  // commands must be executed synchronously, i.e. one at a time in order
  const child_process = execSync(cmd, function(error, stdout, stderr) {
    if (error) {
      throw error;
    }
  });
});
