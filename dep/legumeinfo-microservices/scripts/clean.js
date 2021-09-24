#!/usr/bin/env node
/**
 * Removes and creates the directories required by the build script.
 */

'use strict';

const exec = require('child_process').exec;

const commands = [
  'rm -rf ./proto && mkdir ./proto',
  'rm -rf ./src && mkdir ./src',
  'rm -rf ./dist && mkdir ./dist'
];

commands.forEach((cmd) => {
  // commands must be executed synchronously, i.e. one at a time in order
  const child_process = exec(cmd, function(error, stdout, stderr) {
    if (error) {
      throw error;
    }
  });
});
