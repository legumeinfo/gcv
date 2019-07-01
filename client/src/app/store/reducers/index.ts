// Angular
import { Params, RouterStateSnapshot } from "@angular/router";
import { environment } from "../../../environments/environment";
// store
import * as fromRouterStore from "@ngrx/router-store";
import { ActionReducerMap, createFeatureSelector, MetaReducer } from "@ngrx/store";
import { storeFreeze } from "ngrx-store-freeze";
// reducers
import * as fromPairwiseBlocks from "./pairwise-blocks.reducer";
import * as fromChromosome from "./chromosome.reducer";
import * as fromClusteredMicroTracks from "./clustered-micro-tracks.store";
import * as fromGene from "./gene.reducer";
import * as fromGlobalPlots from "./global-plots.store";
import * as fromLocalPlots from "./local-plots.store";
import * as fromMacroChromosome from "./macro-chromosome.store";
import * as fromMacroTracks from "./macro-tracks.store";
//import * as fromMicroTracks from "./micro-tracks.store";
import * as fromMicroTracks from "./micro-tracks.reducer";
import * as fromMultiMacroChromosome from "./multi-macro-chromosome.store";
import * as fromMultiMacroTracks from "./multi-macro-tracks.store";
import * as fromRouter from "./router.store";
import * as fromSearchQueryTrack from "./search-query-track.store";

export interface State {
  pairwiseBlocks: fromPairwiseBlocks.State;
  chromosome: fromChromosome.State;
  clusteredMicroTracks: fromClusteredMicroTracks.State;
  gene: fromGene.State;
  globalPlots: fromGlobalPlots.State;
  localPlots: fromLocalPlots.State;
  macroChromosome: fromMacroChromosome.State;
  macroTracks: fromMacroTracks.State;
  microTracks: fromMicroTracks.State;
  multiMacroChromosome: fromMultiMacroChromosome.State;
  multiMacroTracks: fromMultiMacroTracks.State;
  router: fromRouterStore.RouterReducerState<fromRouter.RouterStateUrl>;
  searchQueryTrack: fromSearchQueryTrack.State;
}

export const reducers: ActionReducerMap<State> = {
  pairwiseBlocks: fromPairwiseBlocks.reducer,
  chromosome: fromChromosome.reducer,
  clusteredMicroTracks: fromClusteredMicroTracks.reducer,
  gene: fromGene.reducer,
  globalPlots: fromGlobalPlots.reducer,
  localPlots: fromLocalPlots.reducer,
  macroChromosome: fromMacroChromosome.reducer,
  macroTracks: fromMacroTracks.reducer,
  microTracks: fromMicroTracks.reducer,
  multiMacroChromosome: fromMultiMacroChromosome.reducer,
  multiMacroTracks: fromMultiMacroTracks.reducer,
  router: fromRouterStore.routerReducer,
  searchQueryTrack: fromSearchQueryTrack.reducer,
};

export const metaReducers: Array<MetaReducer<State>> = environment.production ? [storeFreeze] : [];
