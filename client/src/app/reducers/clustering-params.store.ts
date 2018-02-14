import * as clusteringParamActions from "../actions/clustering-params.actions";
import { ClusteringParams } from "../models/clustering-params.model";

export function reducer(
  state = new ClusteringParams(),
  action: clusteringParamActions.Actions,
) {
  switch (action.type) {
    case clusteringParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
