import { Track } from '@gcv/gene/models';
import { nameSourceID } from './name-source-id';


export type TrackMap = {[key: string]: Track};


export function trackMap(tracks: Track[]): TrackMap {
  const map: TrackMap = {};
  tracks.forEach((t) => {
    const id = nameSourceID(t.name, t.source);
    map[id] = t;
  });
  return map;
}
