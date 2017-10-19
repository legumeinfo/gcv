import { StoreActions } from '../constants/store-actions';

export const microTracks = (state: any = {families: [], groups: []},
{type, payload}) => {
  switch (type) {
    case StoreActions.ADD_MICRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
