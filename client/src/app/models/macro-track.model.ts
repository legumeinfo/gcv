import { MacroBlock } from "./macro-block.model";

export interface MacroTrack {
  blocks: MacroBlock[];
  chromosome: string;
  length?: number;
}
