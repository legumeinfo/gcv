import { Algorithm } from '@gcv/gene/models';
import { trackName } from './utils';
import { AlgorithmMap, algorithmMap } from './utils';


export const MICRO_ORDER_ALGORITHMS: Algorithm[] = [
  {
    id: 'chromosome',
    name: 'Chromosome name',
    algorithm: (t1, t2) => {
      const name1 = trackName(t1);
      const name2 = trackName(t2);
      return name1.localeCompare(name2);
    },
  },
  {
    id: 'distance',
    name: 'Edit distance',
    algorithm: (t1, t2) => {
      return t2.score-t1.score;
    },
  },
];


export const MICRO_ORDER_ALGORITHM_MAP: AlgorithmMap
  = algorithmMap(MICRO_ORDER_ALGORITHMS);
