import { ChromosomeEffects } from './chromosome.effects';
import { FamilyEffects } from './family.effects';
import { GeneEffects } from './gene.effects';
import { MicroTracksEffects } from './micro-tracks.effects';
import { PairwiseBlocksEffects } from './pairwise-blocks.effects';
import { RegionEffects } from './region.effects';

export const effects: any[] = [
  ChromosomeEffects,
  GeneEffects,
  FamilyEffects,
  MicroTracksEffects,
  PairwiseBlocksEffects,
  RegionEffects,
];

export * from './chromosome.effects';
export * from './family.effects';
export * from './gene.effects';
export * from './micro-tracks.effects';
export * from './pairwise-blocks.effects';
export * from './region.effects';
