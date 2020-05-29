import { Algorithm } from '@gcv/gene/models';
import { pairwiseBlocksName } from './utils';
import { AlgorithmMap, algorithmMap } from './utils';


export const MACRO_ORDER_ALGORITHMS: Algorithm[] = [
  {
    id: 'chromosome',
    name: 'Chromosome name',
    algorithm: (t1, t2) => {
      const name1 = pairwiseBlocksName(t1);
      const name2 = pairwiseBlocksName(t2);
      return name1.localeCompare(name2);
    },
  },
  {
    id: 'position',
    name: 'Start Position',
    algorithm: (t1, t2) => {
      if (t1.blocks.length == 0 && t2.blocks.length == 0) {
        return 0;
      } else if (t1.blocks.length == 0) {
        return 1;
      } else if (t2.blocks.length == 0) {
        return -1;
      }
      const t1Start = Math.min(...t1.blocks.map((b) => b.i));
      const t2Start = Math.min(...t2.blocks.map((b) => b.i));
      return t1Start-t2Start;
    },
  },
];


export const MACRO_ORDER_ALGORITHM_MAP: AlgorithmMap
  = algorithmMap(MACRO_ORDER_ALGORITHMS);
