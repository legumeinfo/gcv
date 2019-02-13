import { Gene } from "./gene.model";


export class Group<T={}> {
  species_id: number;
  genus: string;
  species: string;
  chromosome_id: number;
  chromosome_name: string;
  genes: Array<Gene & T>;
  // TODO: introduce options as mixins
  source?: string;  // Server ID
  id?: string;  // unique
}
