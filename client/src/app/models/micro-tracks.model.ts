import { Family } from "./family.model";
import { Group } from "./group.model";


export class MicroTracks<R={}, S={}, T={}> {
  families: Array<Family & R> = [];
  groups: Array<Group<T> & S> = [];
}
