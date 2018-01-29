import { StoreActions } from '../constants/store-actions';

export const multiQueryGenes = (state: Array<string>, {type, payload}) => {
  switch (type) {
    case StoreActions.NEW_MULTI_QUERY_GENES:
      return payload;
    default:
      return state;
  }
};
