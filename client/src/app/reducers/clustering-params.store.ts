import * as clusteringParamActions from "../actions/clustering-params.actions";
import { ClusteringParams } from "../models/clustering-params.model";

// interface that ClusteringParams implements
export interface State {
  alpha: number;
  kappa: number;
  minsup: number;
  minsize: number;
}

export function reducer(
  state = new ClusteringParams(),
  action: clusteringParamActions.Actions,
): State {
  switch (action.type) {
    case clusteringParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
