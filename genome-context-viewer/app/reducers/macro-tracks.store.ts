import { ADD_MACRO_TRACKS } from './actions';

export const macroTracks = (state: any = {}, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent as the new tracks
    case ADD_MACRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
