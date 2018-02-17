import { createFeatureSelector, createSelector } from "@ngrx/store";
import { RouterStateUrl } from "../utils/custom-router-state-serializer.util";
import * as fromRouter from "@ngrx/router-store";

export const getRouterState = createFeatureSelector
  <fromRouter.RouterReducerState<RouterStateUrl>>("router");

export const getSearchRoute = createSelector(
  getRouterState,
  (route) => {
    const params = route.state.params;
    return {source: params.source, gene: params.gene};
  },
);

export const getMultiRoute = createSelector(
  getRouterState,
  (route) => {
    const params = route.state.params;
    return {genes: params.genes};
  },
);

export const getQueryParams = createSelector(
  getRouterState,
  (route) => route.state.queryParams,
);
