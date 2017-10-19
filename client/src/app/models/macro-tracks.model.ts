import { MacroTrack } from './macro-track.model';
import { MacroBlock } from './macro-block.model';

export interface MacroTracks {
  chromosome: string;
  length: number;
  tracks: MacroTrack[];
}
