import { Family } from './family.model';
import { Group }  from './group.model';

export class MicroTracks {
  constructor(
    public families: Family[],
    public groups: Group[]
  ) { }
}
