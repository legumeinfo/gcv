import { Algorithm, Gene } from '@gcv/gene/models';
import { GCV } from '@gcv-assets/js/gcv';

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
