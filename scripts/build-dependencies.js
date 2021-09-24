#!/usr/bin/env node

'use strict';

const path = require('path');
const execSync = require('child_process').execSync;

const commands = [
  'npm install --only=dev',
  'npm install',
  'npm run build'
];
const build_dir = path.resolve('./dep/legumeinfo-microservices');
const options = {cwd: build_dir};

commands.forEach((cmd) => {
  // commands must be executed synchronously, i.e. one at a time in order
  const child_process = execSync(cmd, options, function(error, stdout, stderr) {
    if (error) {
      throw error;
    }
  });
});
