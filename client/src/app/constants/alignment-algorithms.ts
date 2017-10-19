import { Algorithm } from '../models/algorithm.model';
import { Gene }      from '../models/gene.model';

import { GCV } from '../../assets/js/gcv';

export const ALIGNMENT_ALGORITHMS: Algorithm[] = [
  {
    id: 'smith-waterman',
    name: 'Smith-Waterman',
    algorithm: GCV.alignment.smithWaterman
  },
  {
    id: 'repeat',
    name: 'Repeat',
    algorithm: GCV.alignment.repeat
  }
]
