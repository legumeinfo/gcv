import { ClusterMixin } from './mixins';


export class Track {
  length: number;
  families:  string[];  // family ids
  genes: string[];  // gene names
  name: string;
  genus: string;
  species: string;
  source: string;
}


export function trackID(track: Track): string {
  const name = track.name;
  const first = track.genes[0];
  const last = track.genes[track.genes.length-1];
  const source = track.source;
  return `${name}:${first}:${last}:${source}`;
}


export function clusteredTrackID(track: (Track & ClusterMixin)): string {
  const cluster = track.cluster;
  const id = trackID(track);
  return `${cluster}:${id}`;
}
