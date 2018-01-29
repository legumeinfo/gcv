import { MicroTracks }  from '../models/micro-tracks.model';
import { StoreActions } from '../constants/store-actions';

export const clusteredMicroTracks = (state = new MicroTracks(),
{type, payload}) => {
  switch (type) {
    case StoreActions.NEW_CLUSTERED_TRACKS:
      return payload;
    default:
      return state;
  }
};
