import { FilterService } from './filter.service';
import { ChromosomeService } from './chromosome.service';
import { GeneService } from './gene.service';
import { LayoutService } from './layout.service';
import { MicroTracksService } from './micro-tracks.service';
import { PairwiseBlocksService} from './pairwise-blocks.service';
import { PlotsService } from './plots.service';

export const services: any[] = [
  ChromosomeService,
  FilterService,
  GeneService,
  LayoutService,
  MicroTracksService,
  PairwiseBlocksService,
  PlotsService,
];

export * from './chromosome.service';
export * from './filter.service';
export * from './gene.service';
export * from './layout.service';
export * from './micro-tracks.service';
export * from './pairwise-blocks.service';
export * from './plots.service';
