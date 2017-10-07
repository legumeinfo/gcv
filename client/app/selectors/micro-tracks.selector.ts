import { MicroTracks } from '../models/micro-tracks.model';

declare var Graph: any;

export const microTracksSelector = (options?: any) => {
  return state => state.map(([tracks, ...filters]) => {
    let filteredTracks = Object.assign({}, tracks);
    if (filteredTracks !== undefined) {
      for (let i = 0; i < filters.length; ++i) {
        let f = filters[i];
        filteredTracks = f.algorithm(filteredTracks, options);
      }
    }
    return filteredTracks;
  })
};
