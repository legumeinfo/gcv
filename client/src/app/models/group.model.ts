import { Gene, isGene } from "./gene.model";


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


export function isGroup(instance: any): instance is Group {
  const group = <Group>instance;
  return group !== null &&
         typeof group.species_id === "number" &&
         typeof group.genus === "string" &&
         typeof group.species === "string" &&
         typeof group.chromosome_id === "number" &&
         typeof group.chromosome_name === "string" &&
         (group.source === undefined || typeof group.source === "string") &&
         (group.id === undefined || typeof group.id === "string") &&
         Array.isArray(group.genes) && group.genes.every(isGene);
}
