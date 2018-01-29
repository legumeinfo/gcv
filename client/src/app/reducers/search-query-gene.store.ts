import { StoreActions } from '../constants/store-actions';

export const searchQueryGene = (state: any, {type, payload}) => {
  switch (type) {
    case StoreActions.NEW_SEARCH_QUERY_GENE:
      return payload;
    default:
      return state;
  }
};
