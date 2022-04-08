#!/usr/bin/env node
/*
 * A script that generates a variety of scaled down copies of a screenshot for
 * use in the GCV instructions page.
 */

'use strict';

const path = require('path');
const sharp = require('sharp');

if (process.argv.length == 2) {
  const script = path.basename(process.argv[2]);
  console.log(`${script} IMAGE_FILE [OUTPUT_PATH]`);
  process.exit(1);
}

function getNormalSize({width, height, orientation}) {
  return orientation || 0 >= 5
    ? { width: height, height: width }
    : { width, height };
}

function getOutputImageInfo(image_file_parts, width) {
  const filename = `${image_file_parts.name}-${width}w${image_file_parts.ext}`;
  const filepath = path.join(image_file_parts.dir, filename);
  const responsive = `${filename} ${width}w`;
  return {filename, filepath, responsive};
}

async function scaleImage(resize_widths) {

  // get the input image and information about it
  const image_file = process.argv[2];
  const image_file_parts = path.parse(image_file);
  const image = sharp(image_file);
  const size = getNormalSize(await image.metadata());

  // get the output location
  if (process.argv.length >= 4) {
    image_file_parts.dir = process.argv[3];
  }

  // generate scaled copies of the input image
  console.log(`Writing files to: ${image_file_parts.dir}`);
  const responsive = [];
  for (let i = 0; i < resize_widths.length; i++) {
    let width = resize_widths[i];
    if (size.width <= width) {
      width = size.width;
    }
    const output_info = getOutputImageInfo(image_file_parts, width);
    let status_msg = `\t${output_info.filename}`;
    if (size.width <= width) {
      status_msg += ` (verbatim copy of ${image_file_parts.base})`;
    }
    status_msg += '... ';
    process.stdout.write(status_msg);
    await image
      .resize({width})
      .toFile(output_info.filepath)
      .then(() => {
        process.stdout.write('done!');
        responsive.push(output_info.responsive);
      })
      .catch(() => {
        process.stdout.write('failed!');
      })
      .finally(() => {
        process.stdout.write('\n');
      });
    // we don't want to scale up
    if (size.width <= width) {
      break;
    }
  }

  return responsive;

}

const resize_widths = [320, 640, 960, 1280, 1920, 2560];

scaleImage(resize_widths).then((responsive) => {

  // tell the user how to use these files with GCV
  const img = responsive[responsive.length-1].split(' ')[0];
  const responsive_json = '[' + responsive.map((i) => `"${i}"`).join(', ') + ']';

  console.log(`
Files generated!

Add the following to your GCV config.json file to use them (be sure to update the paths to reflect where the files are hosted):

{
  ...
  "dashboard" {
    "...": {
      "img": "${img}",
      "responsive": ${responsive_json},
      "title": "...",
      "caption": "..."
    }
  },
  ...
}
  `);

});
