import { Algorithm, Gene } from '@gcv/gene/models';
import { GCV } from '@gcv-assets/js/gcv';

export const ALIGNMENT_ALGORITHMS: Algorithm[] = [
  {
    algorithm: GCV.alignment.smithWaterman,
    id: 'smith-waterman',
    name: 'Smith-Waterman',
  },
  {
    algorithm: GCV.alignment.repeat,
    id: 'repeat',
    name: 'Repeat',
  },
];
