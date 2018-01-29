import { StoreActions }     from '../constants/store-actions';
import { ClusteringParams } from '../models/clustering-params.model';

export const clusteringParams = (state = new ClusteringParams(),
{type, payload}) => {
  switch (type) {
    case StoreActions.UPDATE_CLUSTERING_PARAMS:
      return payload;
    default:
      return state;
  }
};
