import { StoreActions } from '../constants/store-actions';

export const macroTracks = (state: any = undefined,
{type, payload}) => {
  switch (type) {
    case StoreActions.ADD_MACRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
