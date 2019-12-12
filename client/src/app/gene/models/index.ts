import { Alert } from './alert.model';
import { Algorithm } from './algorithm.model';
import { Gene } from './gene.model';
import { Pair } from './pair.model';
import { PairwiseBlock } from './pairwise-block.model';
import { PairwiseBlocks } from './pairwise-blocks.model';
import { Plot } from './plot.model';
import { Track } from './track.model';

export const models: any[] = [
  Alert,
  Algorithm,
  Gene,
  Pair,
  PairwiseBlock,
  PairwiseBlocks,
  Plot,
  Track,
];

export * from './alert.model';
export * from './algorithm.model';
export * from './gene.model';
export * from './pair.model';
export * from './pairwise-block.model';
export * from './pairwise-blocks.model';
export * from './plot.model';
export * from './track.model';
