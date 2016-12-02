import { ADD_MICRO_TRACKS } from './actions';

export const microTracks = (state: any = {}, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent as the new tracks
    case ADD_MICRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
