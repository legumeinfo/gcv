import { FilterService } from './filter.service';
import { ChromosomeService } from './chromosome.service';
import { DetailsService } from './details.service';
import { GeneService } from './gene.service';
import { MicroTracksService } from './micro-tracks.service';
import { PairwiseBlocksService} from './pairwise-blocks.service';
import { PlotsService } from './plots.service';

export const services: any[] = [
  ChromosomeService,
  DetailsService,
  FilterService,
  GeneService,
  MicroTracksService,
  PairwiseBlocksService,
  PlotsService,
];

export * from './chromosome.service';
export * from './details.service';
export * from './filter.service';
export * from './gene.service';
export * from './micro-tracks.service';
export * from './pairwise-blocks.service';
export * from './plots.service';
