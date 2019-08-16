import { ChromosomeService } from "./chromosome.service";
import { ClusteringService } from "./clustering.service";
import { DetailsService } from "./details.service";
import { FilterService } from "./filter.service";
import { GeneService } from "./gene.service";
import { InterAppCommunicationService } from "./inter-app-communication.service";
import { MacroTracksService } from "./macro-tracks.service";
import { MicroTracksService } from "./micro-tracks.service";
import { PairwiseBlocksService} from "./pairwise-blocks.service";
import { PlotsService } from "./plots.service";
import { TourService } from "./tour.service";

export const services: any[] = [
  ChromosomeService,
  ClusteringService,
  DetailsService,
  FilterService,
  GeneService,
  InterAppCommunicationService,
  MacroTracksService,
  MicroTracksService,
  PairwiseBlocksService,
  PlotsService,
  TourService,
];

export * from "./chromosome.service";
export * from "./clustering.service";
export * from "./details.service";
export * from "./filter.service";
export * from "./gene.service";
export * from "./inter-app-communication.service";
export * from "./macro-tracks.service";
export * from "./micro-tracks.service";
export * from "./pairwise-blocks.service";
export * from "./plots.service";
export * from "./tour.service";
