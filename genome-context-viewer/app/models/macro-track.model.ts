import { MacroBlock } from './macro-block.model';

export interface MacroTrack {
  chromosome: string;
  blocks: MacroBlock[];
}
