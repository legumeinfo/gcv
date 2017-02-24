import { Algorithm } from '../models/algorithm.model';
import { Gene }      from '../models/gene.model';

declare var Alignment: any;

export const ALIGNMENT_ALGORITHMS: Algorithm[] = [
  {
    id: 'smith-waterman',
    name: 'Smith-Waterman',
    algorithm: Alignment.smithWaterman
  },
  {
    id: 'repeat',
    name: 'Repeat',
    algorithm: Alignment.repeat
  }
]
