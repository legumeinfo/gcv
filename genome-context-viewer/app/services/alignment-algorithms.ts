export class AlignmentAlgorithm {
  id: string;
  name: string;
  algorithm: any;
}

export const ALIGNMENT_ALGORITHMS: AlignmentAlgorithm[] = [
  {
    id: 'smith-waterman',
    name: 'Smith-Waterman',
    algorithm: function () { }
  },
  {
    id: 'repeat',
    name: 'Repeat',
    algorithm: function () { }
  }
]
