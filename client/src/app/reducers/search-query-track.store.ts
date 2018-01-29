import { Group }        from '../models/group.model';
import { StoreActions } from '../constants/store-actions';

export const searchQueryTrack = (state: Group, {type, payload}) => {
  switch (type) {
    case StoreActions.NEW_SEARCH_QUERY_TRACK:
      return payload;
    default:
      return state;
  }
};
