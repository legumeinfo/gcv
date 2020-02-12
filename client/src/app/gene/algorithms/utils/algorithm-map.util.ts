import { Algorithm } from '@gcv/gene/models';


export type AlgorithmMap = {[key: string]: Algorithm};


export function algorithmMap(algorithms: Algorithm[]): AlgorithmMap {
  const map: AlgorithmMap = {};
  algorithms.forEach((a) => map[a.id] = a);
  return map;
}
