import * as microTrackActions from "../actions/micro-tracks.actions";
import { MicroTracks } from "../models/micro-tracks.model";

export function reducer(
  state = new MicroTracks(),
  action: microTrackActions.Actions,
) {
  switch (action.type) {
    case microTrackActions.NEW:
      return action.payload;
    case microTrackActions.ADD:
      // TODO: clone state and add merge with payload
      return action.payload;
    default:
      return state;
  }
}
