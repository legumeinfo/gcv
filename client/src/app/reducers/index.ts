// Angular
import { isDevMode } from "@angular/core";
import { Params, RouterStateSnapshot } from "@angular/router";

// store
import * as fromRouter from "@ngrx/router-store";
import { ActionReducerMap, createFeatureSelector, MetaReducer } from "@ngrx/store";
import { storeFreeze } from "ngrx-store-freeze";

// reducers
import { RouterStateUrl } from "../utils/custom-router-state-serializer.util";
import * as fromAlignedMicroTracks from "./aligned-micro-tracks.store";
import * as fromAlignmentParams from "./alignment-params.store";
import * as fromBlockParams from "./block-params.store";
import * as fromClusteredMicroTracks from "./clustered-micro-tracks.store";
import * as fromClusteringParams from "./clustering-params.store";
import * as fromMacroChromosome from "./macro-chromosome.store";
import * as fromMacroTracks from "./macro-tracks.store";
import * as fromMicroTracks from "./micro-tracks.store";
import * as fromQueryParams from "./query-params.store";
import * as fromSearchQueryTrack from "./search-query-track.store";

export interface State {
  alignedMicroTracks: fromAlignedMicroTracks.State;
  alignmentParams: fromAlignmentParams.State;
  blockParams: fromBlockParams.State;
  clusteredMicroTracks: fromClusteredMicroTracks.State;
  clusteringParams: fromClusteringParams.State;
  macroChromosome: fromMacroChromosome.State;
  macroTracks: fromMacroTracks.State;
  microTracks: fromMicroTracks.State;
  queryParams: fromQueryParams.State;
  router: fromRouter.RouterReducerState<RouterStateUrl>;
  searchQueryTrack: fromSearchQueryTrack.State;
}

export const reducers: ActionReducerMap<State> = {
  alignedMicroTracks: fromAlignedMicroTracks.reducer,
  alignmentParams: fromAlignmentParams.reducer,
  blockParams: fromBlockParams.reducer,
  clusteredMicroTracks: fromClusteredMicroTracks.reducer,
  clusteringParams: fromClusteringParams.reducer,
  macroChromosome: fromMacroChromosome.reducer,
  macroTracks: fromMacroTracks.reducer,
  microTracks: fromMicroTracks.reducer,
  queryParams: fromQueryParams.reducer,
  router: fromRouter.routerReducer,
  searchQueryTrack: fromSearchQueryTrack.reducer,
};

export const metaReducers: Array<MetaReducer<State>> = isDevMode() ? [storeFreeze] : [];
