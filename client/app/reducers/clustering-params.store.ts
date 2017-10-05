import { ADD_CLUSTERING_PARAMS } from '../constants/actions';
import { ClusteringParams }      from '../models/clustering-params.model';

export const clusteringParams = (
  state: ClusteringParams = new ClusteringParams(0.5, 10, 2, 5),
  {type, payload}
) => {
  switch (type) {
    // replaces the existing state with the new state
    case ADD_CLUSTERING_PARAMS:
      return payload;
    default:
      return state;
  }
};
