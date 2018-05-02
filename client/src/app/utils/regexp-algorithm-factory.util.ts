import { Algorithm } from "../models/algorithm.model";
import { MicroTracks } from "../models/micro-tracks.model";

export function regexpFilter(
  regexp: string,
  tracks: MicroTracks,
  options: any
): MicroTracks {
  // parse optional parameters
  options = options || {};
  options.skipFirst = options.skipFirst || false;
  options.prefix = options.prefix || ((t) => "");
  // create filterable "copy" of tracks
  const filter = new RegExp(regexp);
  const filteredTracks = new MicroTracks();
  filteredTracks.families = tracks.families;
  // filter tracks
  filteredTracks.groups = tracks.groups.filter((track, i) => {
    if (options.skipFirst && i == 0) {
      return true;
    }
    const name = options.prefix(track) + track.chromosome_name;
    return filter.test(name);
  });
  // return filtered tracks
  return filteredTracks;
};

export function regexpAlgorithmFactory(regexp: string): Algorithm {
  return new Algorithm("regexp", "Regular Expression", regexpFilter.bind(this, regexp));
}
