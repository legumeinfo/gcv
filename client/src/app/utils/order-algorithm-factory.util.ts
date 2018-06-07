import { Algorithm, MicroTracks } from "../models";

export function orderFilter(compare, tracks: MicroTracks, options: any): MicroTracks {
  // parse optional parameters
  options = options || {};
  options.skipFirst = options.skipFirst || false;
  options.prefix = options.prefix || ((t) => "");
  // make a sortable "copy" of the tracks
  const orderedTracks = new MicroTracks();
  orderedTracks.families = tracks.families;
  orderedTracks.groups = tracks.groups.slice();
  // ignore first track if necessary
  let first;
  if (options.skipFirst) {
    first = orderedTracks.groups.shift();
  }
  // sort tracks
  orderedTracks.groups.sort(compare.bind(this, options.prefix));
  // add back first track if necessary
  if (first !== undefined) {
    orderedTracks.groups.unshift(first);
  }
  // returned sorted result
  return orderedTracks;
};

export function orderAlgorithmFactory(id: string, name: string, compare): Algorithm {
  return new Algorithm(id, name, orderFilter.bind(this, compare));
}
