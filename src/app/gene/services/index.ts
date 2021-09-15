import { ChromosomeService } from './chromosome.service';
import { ComponentService } from './component.service';
import { GeneService } from './gene.service';
import { InterAppCommunicationService } from './inter-app-communication.service';
import { LayoutService } from './layout.service';
import { MicroTracksService } from './micro-tracks.service';
import { PairwiseBlocksService} from './pairwise-blocks.service';
import { ParamsService } from './params.service';
import { PlotsService } from './plots.service';
import { ProcessService } from './process.service';
import { RegionService } from './region.service';

export const services: any[] = [
  ChromosomeService,
  ComponentService,
  GeneService,
  InterAppCommunicationService,
  LayoutService,
  MicroTracksService,
  PairwiseBlocksService,
  ParamsService,
  PlotsService,
  ProcessService,
  RegionService,
];

export * from './chromosome.service';
export * from './component.service';
export * from './gene.service';
export * from './inter-app-communication.service';
export * from './layout.service';
export * from './micro-tracks.service';
export * from './pairwise-blocks.service';
export * from './params.service';
export * from './plots.service';
export * from './process.service';
export * from './region.service';
