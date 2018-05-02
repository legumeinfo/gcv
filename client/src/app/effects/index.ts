import { AlignmentEffects } from "./alignment.effects";
import { ClusteringEffects } from "./clustering.effects";
import { MacroTracksEffects } from "./macro-tracks.effects";
import { MicroTracksEffects } from "./micro-tracks.effects";
import { PlotsEffects } from "./plots.effects";
import { RouterEffects } from "./router.effects";

export const effects: any[] = [
  AlignmentEffects,
  ClusteringEffects,
  MacroTracksEffects,
  MicroTracksEffects,
  PlotsEffects,
  RouterEffects,
];

export * from "./alignment.effects";
export * from "./clustering.effects";
export * from "./macro-tracks.effects";
export * from "./micro-tracks.effects";
export * from "./plots.effects";
export * from "./router.effects";
