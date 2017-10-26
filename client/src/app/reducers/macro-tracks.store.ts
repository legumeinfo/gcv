import { StoreActions } from '../constants/store-actions';

const defaultState = undefined;
export const macroTracks = (state: any = defaultState,
{type, payload}) => {
  switch (type) {
    case StoreActions.ADD_MACRO_TRACKS:
      return payload;
    case StoreActions.RESET:
      return defaultState;
    default:
      return state;
  }
};
