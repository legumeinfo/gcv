import { Algorithm } from '../models/algorithm.model';

export const ORDER_ALGORITHMS: Algorithm[] = [
  {
    id: 'chromosome',
    name: 'Chromosome name',
    algorithm: (tracks, options) => {
      options = options || {};
      options.skipFirst = options.skipFirst || false;
      let orderedTracks = Object.assign({}, tracks);
      let first = undefined;
      if (options.skipFirst) first = orderedTracks.groups.shift();
      orderedTracks.groups.sort((a, b) => {
        return a.chromosome_name.localeCompare(b.chromosome_name);
      });
      if (first !== undefined) orderedTracks.groups.unshift(first);
      return orderedTracks;
    }
  },
  {
    id: 'distance',
    name: 'Edit distance',
    algorithm: (tracks, options) => {
      options = options || {};
      options.skipFirst = options.skipFirst || false;
      let orderedTracks = Object.assign({}, tracks);
      let first = undefined;
      if (options.skipFirst) first = orderedTracks.groups.shift();
      orderedTracks.groups.sort((a, b) => {
        let diff = b.score - a.score
        if (diff == 0) {
          if (a.chromosome_name == b.chromosome_name) {
            if (a.id == b.id) {
              return a.genes[0].x - b.genes[0].x;
            }
            return a.id - b.id;
          }
          return (a.chromosome_name > b.chromosome_name) ? 1 : -1;
        }
        return diff;
      });
      if (first !== undefined) orderedTracks.groups.unshift(first);
      return orderedTracks;
    }
  }
]
