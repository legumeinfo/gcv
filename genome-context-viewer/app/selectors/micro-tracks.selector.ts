import { MicroTracks } from '../models/micro-tracks.model';

export const microTracksSelector = (options?: any) => {
  return state => state
    // args[0] = MicroTracks
    // args[1:] = Array<filter>
    .map((args) => {
      let tracks = Object.assign({}, args[0]);
      for (let i = 1; i < args.length; ++i) {
        let f = args[i];
        tracks = f.algorithm(tracks, options);
      }
      return tracks;
    })
};
