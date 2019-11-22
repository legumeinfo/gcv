import { FilterService } from './filter.service';
import { ChromosomeService } from './chromosome.service';
import { ComponentService } from './component.service';
import { GeneService } from './gene.service';
import { LayoutService } from './layout.service';
import { MicroTracksService } from './micro-tracks.service';
import { PairwiseBlocksService} from './pairwise-blocks.service';
import { ParamsService } from './params.service';
import { PlotsService } from './plots.service';

export const services: any[] = [
  ChromosomeService,
  ComponentService,
  FilterService,
  GeneService,
  LayoutService,
  MicroTracksService,
  PairwiseBlocksService,
  ParamsService,
  PlotsService,
];

export * from './chromosome.service';
export * from './component.service';
export * from './filter.service';
export * from './gene.service';
export * from './layout.service';
export * from './micro-tracks.service';
export * from './pairwise-blocks.service';
export * from './params.service';
export * from './plots.service';
