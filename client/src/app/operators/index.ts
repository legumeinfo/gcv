import { macroTracksOperator } from "./macro-tracks.operator";
import { microTracksOperator } from "./micro-tracks.operator";
import { multiMacroTracksOperator } from "./multi-macro-tracks.operator";
import { plotsOperator } from "./plots.operator";

export const operators: any[] = [
  macroTracksOperator,
  microTracksOperator,
  multiMacroTracksOperator,
  plotsOperator,
];

export * from "./macro-tracks.operator";
export * from "./micro-tracks.operator";
export * from "./multi-macro-tracks.operator";
export * from "./plots.operator";
