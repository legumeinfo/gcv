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
import * as fromGene from "./gene.reducer";
import * as fromMicroTracks from "./micro-tracks.reducer";
import * as fromRouter from "./router.reducer";

export interface State {
  pairwiseBlocks: fromPairwiseBlocks.State;
  chromosome: fromChromosome.State;
  gene: fromGene.State;
  microTracks: fromMicroTracks.State;
  router: fromRouterStore.RouterReducerState<fromRouter.RouterStateUrl>;
}

export const reducers: ActionReducerMap<State> = {
  pairwiseBlocks: fromPairwiseBlocks.reducer,
  chromosome: fromChromosome.reducer,
  gene: fromGene.reducer,
  microTracks: fromMicroTracks.reducer,
  router: fromRouterStore.routerReducer,
};

export const metaReducers: Array<MetaReducer<State>> =
  environment.production ? [storeFreeze] : [];
