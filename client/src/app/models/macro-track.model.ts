import { MacroBlock } from "./macro-block.model";

export class MacroTrack {
  blocks: MacroBlock[];
  chromosome: string;
  genus?: string;
  species?: string;
  length?: number;
}
