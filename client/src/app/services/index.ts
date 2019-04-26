import { AlignmentService } from "./alignment.service";
import { ClusteringService } from "./clustering.service";
import { DetailsService } from "./details.service";
import { FilterService } from "./filter.service";
import { InterAppCommunicationService } from "./inter-app-communication.service";
import { MacroTracksService } from "./macro-tracks.service";
import { MicroTracksService } from "./micro-tracks.service";
import { PlotsService } from "./plots.service";
import { TourService } from "./tour.service";

export const services: any[] = [
  AlignmentService,
  ClusteringService,
  DetailsService,
  FilterService,
  InterAppCommunicationService,
  MacroTracksService,
  MicroTracksService,
  PlotsService,
  TourService,
];

export * from "./alignment.service";
export * from "./clustering.service";
export * from "./details.service";
export * from "./filter.service";
export * from "./inter-app-communication.service";
export * from "./macro-tracks.service";
export * from "./micro-tracks.service";
export * from "./plots.service";
export * from "./tour.service";
