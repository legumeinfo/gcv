import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as clusteringParamActions from "../actions/clustering-params.actions";
import { ClusteringParams } from "../models/clustering-params.model";

// interface that ClusteringParams implements
export interface State {
  clusteringParams: ClusteringParams;
}

export const initialState: State = {clusteringParams: new ClusteringParams()};

export function reducer(
  state = initialState,
  action: clusteringParamActions.Actions,
): State {
  switch (action.type) {
    case clusteringParamActions.NEW:
      return {clusteringParams: action.payload};
    default:
      return state;
  }
}

export const getClusteringParamsState = createFeatureSelector<State>("clusteringParams");

export const getClusteringParams = createSelector(
  getClusteringParamsState,
  (state) => state.clusteringParams,
);
