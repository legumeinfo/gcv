import { Algorithm, Gene } from '@gcv/gene/models';
import { GCV } from '@gcv-assets/js/gcv';
import { AlgorithmMap, algorithmMap } from './utils';

export const ALIGNMENT_ALGORITHMS: Algorithm[] = [
  {
    id: 'smith-waterman',
    name: 'Smith-Waterman',
    algorithm: GCV.alignment.smithWaterman,
  },
  {
    id: 'repeat',
    name: 'Repeat',
    algorithm: GCV.alignment.repeat,
  },
];


export const ALIGNMENT_ALGORITHM_MAP: AlgorithmMap
  = algorithmMap(ALIGNMENT_ALGORITHMS);
