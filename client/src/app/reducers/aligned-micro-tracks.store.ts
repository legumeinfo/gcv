import * as alignedMicroTrackActions from "../actions/aligned-micro-tracks.actions";
import { MicroTracks } from "../models/micro-tracks.model";

export function reducer(
  state = new MicroTracks(),
  action: alignedMicroTrackActions.Actions,
) {
  switch (action.type) {
    case alignedMicroTrackActions.NEW:
      return action.payload;
    case alignedMicroTrackActions.ADD:
      // TODO: clone state and add merge with payload
      return action.payload;
    default:
      return state;
  }
}
