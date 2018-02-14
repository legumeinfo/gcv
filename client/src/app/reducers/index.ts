// store
import { ActionReducerMap } from "@ngrx/store";

// reducers
import * as fromAlignedMicroTracks from "./aligned-micro-tracks.store";
import * as fromAlignmentParams from "./alignment-params.store";
import * as fromBlockParams from "./block-params.store";
import * as fromClusteredMicroTracks from "./clustered-micro-tracks.store";
import * as fromClusteringParams from "./clustering-params.store";
import * as fromMacroChromosome from "./macro-chromosome.store";
import * as fromMacroTracks from "./macro-tracks.store";
import * as fromMicroTracks from "./micro-tracks.store";
import * as fromMultiQueryGenes from "./multi-query-genes.store";
import * as fromQueryParams from "./query-params.store";
import * as fromSearchQueryGene from "./search-query-gene.store";
import * as fromSearchQueryTrack from "./search-query-track.store";

// export interface State {
//   alignedMicroTracks: fromAlignedMicroTracks.state,
//   clusteredMicroTracks: fromClusteredMicroTracks.state,
//   microTracks: fromMicroTracks.state,
//   alignmentParams: fromAlignmentParams.state,
//   clusteringParams: fromClusteringParams.state,
//   macroChromosome: fromMacroChromosome.state,
//   multiQueryGenes: fromMultiQueryGenes.state,
//   searchQueryGene: fromSearchQueryGene.state,
//   blockParams: fromBlockParams.state,
//   macroTracks: fromMacroTracks.state,
//   queryParams: fromQueryParams.state,
//   searchQueryTrack: fromSearchQueryTrack.state,
//   router: fromRouter.RouterReducerState<RouterStateUrl>;
// }

// export const reducers: ActionReducerMap<State> = {
export const reducers = {
  alignedMicroTracks: fromAlignedMicroTracks.reducer,
  alignmentParams: fromAlignmentParams.reducer,
  blockParams: fromBlockParams.reducer,
  clusteredMicroTracks: fromClusteredMicroTracks.reducer,
  clusteringParams: fromClusteringParams.reducer,
  macroChromosome: fromMacroChromosome.reducer,
  macroTracks: fromMacroTracks.reducer,
  microTracks: fromMicroTracks.reducer,
  multiQueryGenes: fromMultiQueryGenes.reducer,
  queryParams: fromQueryParams.reducer,
  searchQueryGene: fromSearchQueryGene.reducer,
  searchQueryTrack: fromSearchQueryTrack.reducer,
};
