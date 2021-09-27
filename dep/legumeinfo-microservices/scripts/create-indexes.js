#!/usr/bin/env node
/**
 * Generates an index.ts file for each directory in the source tree.
 */

'use strict';

const execSync = require('child_process').execSync;
const replaceSync = require('replace-in-file').sync;

const output_dir = './src';

// generate index.ts files
const index_cmd = `npx cti create ${output_dir}`;
const child_process = execSync(index_cmd, function(error, stdout, stderr) {
  if (error) {
    throw error;
  }
});

// update index files to import directories as modules but contents from files
const options = {
  // only update index.ts files
  files: `${output_dir}/**/index.ts`,
  // match the "* from './something'" portion of export lines
  from: /\* from '\.\/(.*?)'/g,
  to: (match) => {
    // get the file or directory name from the match
    const name = match.match(/'\.\/(.*?)'/)[1];
    // protobuf stubs are the only exported files, i.e. they end with "_pb"
    if (name.endsWith('_pb')) {
      // don't change the export if it's a file
      return match;
    }
    // export directories as modules
    return `* as ${name} from './${name}'`;
  },
};
replaceSync(options);
