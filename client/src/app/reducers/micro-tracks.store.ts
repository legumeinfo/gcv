import { StoreActions } from '../constants/store-actions';

const defaultState = {families: [], groups: []};
export const microTracks = (state: any = defaultState,
{type, payload}) => {
  switch (type) {
    case StoreActions.ADD_MICRO_TRACKS:
      return payload;
    case StoreActions.RESET:
      return defaultState;
    case StoreActions.CLONE_MICRO:
      return JSON.parse(JSON.stringify(state));
    default:
      return state;
  }
};
