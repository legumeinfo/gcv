// Angular
import { Params, RouterStateSnapshot } from "@angular/router";
import { environment } from "../../../environments/environment";
// store
import * as fromRouterStore from "@ngrx/router-store";
import { ActionReducerMap, createFeatureSelector, MetaReducer } from "@ngrx/store";
import { storeFreeze } from "ngrx-store-freeze";
// reducers
import * as fromAlignedMicroTracks from "./aligned-micro-tracks.store";
import * as fromClusteredMicroTracks from "./clustered-micro-tracks.store";
import * as fromGlobalPlots from "./global-plots.store";
import * as fromLocalPlots from "./local-plots.store";
import * as fromMacroChromosome from "./macro-chromosome.store";
import * as fromMacroTracks from "./macro-tracks.store";
import * as fromMicroTracks from "./micro-tracks.store";
import * as fromMultiMacroChromosome from "./multi-macro-chromosome.store";
import * as fromMultiMacroTracks from "./multi-macro-tracks.store";
import * as fromRouter from "./router.store";
import * as fromSearchQueryTrack from "./search-query-track.store";

export interface State {
  alignedMicroTracks: fromAlignedMicroTracks.State;
  clusteredMicroTracks: fromClusteredMicroTracks.State;
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
  alignedMicroTracks: fromAlignedMicroTracks.reducer,
  clusteredMicroTracks: fromClusteredMicroTracks.reducer,
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
