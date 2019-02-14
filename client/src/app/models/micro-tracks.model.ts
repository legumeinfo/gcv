import { Family, isFamily } from "./family.model";
import { Group, isGroup } from "./group.model";


export class MicroTracks<R={}, S={}, T={}> {
  families: Array<Family & R> = [];
  groups: Array<Group<T> & S> = [];
}


export function isMicroTracks(instance: any): instance is MicroTracks {
  const tracks = <MicroTracks>instance;
  return tracks !== null &&
         Array.isArray(tracks.families) &&
         Array.isArray(tracks.groups) && 
         tracks.families.every(isFamily) &&
         tracks.groups.every(isGroup);
}
