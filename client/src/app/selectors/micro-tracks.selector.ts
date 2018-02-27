import { MicroTracks } from "../models/micro-tracks.model";

export const microTracksSelector = (options?: any) => {
  return (state) => state.map(([tracks, ...filters]) => {
    let filteredTracks = tracks;
    if (filteredTracks !== undefined) {
      for (const f of filters) {
        filteredTracks = f.algorithm(filteredTracks, options);
      }
    }
    return filteredTracks;
  });
};
