import { QueryParams }  from '../models/query-params.model';
import { StoreActions } from '../constants/store-actions';

export const queryParams = (state = new QueryParams(), {type, payload}) => {
  switch (type) {
    case StoreActions.UPDATE_QUERY_PARAMS:
      return payload;
    default:
      return state;
  }
};
