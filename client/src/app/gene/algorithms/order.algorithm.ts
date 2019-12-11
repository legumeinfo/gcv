import { Algorithm } from '@gcv/gene/models';
import { trackName } from './utils';


export const ORDER_ALGORITHMS: Algorithm[] = [
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
