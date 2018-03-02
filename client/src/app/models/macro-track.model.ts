import { MacroBlock } from "./macro-block.model";

export class MacroTrack {
  blocks: MacroBlock[];
  chromosome: string;
  genums?: string;
  species?: string;
  length?: number;
}
