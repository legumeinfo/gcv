import { Family } from './family.model';
import { Group }  from './group.model';

export interface MicroTracks {
  families: Family[];
  groups: Group[];
  source?: string;  // Server ID
}
