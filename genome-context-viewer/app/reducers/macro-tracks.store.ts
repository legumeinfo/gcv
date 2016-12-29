import { ADD_MACRO_TRACKS } from '../constants/actions';

export const macroTracks = (state: any = undefined,
{type, payload}) => {
  switch (type) {
    case ADD_MACRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
