import { ADD_MICRO_TRACKS } from '../constants/actions';

export const microTracks = (state: any = {families: [], groups: []},
{type, payload}) => {
  switch (type) {
    case ADD_MICRO_TRACKS:
      return payload;
    default:
      return state;
  }
};
