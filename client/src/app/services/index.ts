import { AlertsService } from "./alerts.service";
import { AlignmentService } from "./alignment.service";
import { ClusteringService } from "./clustering.service";
import { DetailsService } from "./details.service";
import { FilterService } from "./filter.service";
import { MacroTracksService } from "./macro-tracks.service";
import { MicroTracksService } from "./micro-tracks.service";
import { PlotsService } from "./plots.service";

export const services: any[] = [
  AlertsService,
  AlignmentService,
  ClusteringService,
  DetailsService,
  FilterService,
  MacroTracksService,
  MicroTracksService,
  PlotsService,
];

export * from "./alerts.service";
export * from "./alignment.service";
export * from "./clustering.service";
export * from "./details.service";
export * from "./filter.service";
export * from "./macro-tracks.service";
export * from "./micro-tracks.service";
export * from "./plots.service";
