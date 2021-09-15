import { Gene } from '@gcv/gene/models';


export type GeneMap = {[key: string]: Gene};


export function geneMap(genes: Gene[]): GeneMap {
  const map: GeneMap = {};
  genes.forEach((g) => map[g.name] = g);
  return map;
}
