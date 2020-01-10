import { ChromosomeEffects } from './chromosome.effects';
import { GeneEffects } from './gene.effects';
import { MicroTracksEffects } from './micro-tracks.effects';
import { PairwiseBlocksEffects } from './pairwise-blocks.effects';

export const effects: any[] = [
  ChromosomeEffects,
  GeneEffects,
  MicroTracksEffects,
  PairwiseBlocksEffects,
];

export * from './chromosome.effects';
export * from './gene.effects';
export * from './micro-tracks.effects';
export * from './pairwise-blocks.effects';