#!/usr/bin/env node
/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
 * Basically an extension of the .js files in ./node_modules/grpc-tools/bin/
 *
 * This file recursively finds all .proto files in a directory and then builds
 * them into gRPC Web files.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const execFile = require('child_process').execFile;

// where the build should output files
const args = process.argv.slice(2);
const output_dir = path.resolve(args[0]);

// identify platform-specific executable extension
const exe_ext = process.platform === 'win32' ? '.exe' : '';

// the protoc binary
const protoc_dir = './node_modules/grpc-tools/bin'
const protoc = path.resolve(protoc_dir, 'protoc' + exe_ext);

// the gRPC Web protoc plugin
const plugin_dir = './node_modules/protoc-gen-grpc-web/bin'
const plugin = path.resolve(plugin_dir, 'protoc-gen-grpc-web' + exe_ext);

// recursively finds files
async function* walkFiles(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walkFiles(entry);
    else if (d.isFile()) yield entry;
  }
}

// returns paths to all .proto files in the given directory
async function findProtos(root) {
  const proto_paths = [];
  for await (const p of walkFiles(root)) {
    if (p.endsWith('.proto')) {
      proto_paths.push(p);
    }
  }
  return proto_paths;
}

const proto_dir = path.resolve('./proto');

findProtos(proto_dir).then((proto_paths) => {

  const args = [
    `--plugin=protoc-gen-grpc-web=${plugin}`,
    `--js_out=import_style=commonjs,binary:${output_dir}`,
    //`--grpc-web_out=import_style=typescript,mode=grpcweb:${output_dir}`,
    `--grpc-web_out=import_style=commonjs+dts,mode=grpcweb:${output_dir}`,
    //`--grpc-web_out=import_style=commonjs,mode=grpcweb:${output_dir}`,
    `-I${proto_dir}`,
  ].concat(proto_paths);

  // compile the .proto files
  const child_process = execFile(protoc, args, function(error, stdout, stderr) {
    if (error) {
      throw error;
    }
  });

  child_process.stdout.pipe(process.stdout);
  child_process.stderr.pipe(process.stderr);

});
