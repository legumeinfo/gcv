import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as queryParamActions from "../actions/query-params.actions";
import { QueryParams } from "../models/query-params.model";

export interface State {
  queryParams: QueryParams;
}

export const initialState: State = {queryParams: new QueryParams()};

export function reducer(
  state = initialState,
  action: queryParamActions.Actions,
): State {
  switch (action.type) {
    case queryParamActions.NEW:
      return {queryParams: action.payload};
    default:
      return state;
  }
}

export const getQueryParamsState = createFeatureSelector<State>("queryParams");

export const getQueryParams = createSelector(
  getQueryParamsState,
  (state) => state.queryParams,
);

export const getQueryParamsNeighbors = createSelector(
  getQueryParams,
  (queryParams) => queryParams.neighbors,
);
