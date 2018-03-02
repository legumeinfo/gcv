import { GeneLoc } from "./gene-loc.model";

export class MacroChromosome {
  families:  string[];
  genes: string[];
  length: number;
  locations: GeneLoc[];
  genus?: string;
  name?: string;
  source?: string;
  species?: string;
}
