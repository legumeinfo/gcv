import * as clusteredMicroTrackActions from "../actions/clustered-micro-tracks.actions";
import { MicroTracks } from "../models/micro-tracks.model";

export function reducer(
  state = new MicroTracks(),
  action: clusteredMicroTrackActions.Actions,
) {
  switch (action.type) {
    case clusteredMicroTrackActions.NEW:
      return action.payload;
    case clusteredMicroTrackActions.ADD:
      // TODO: clone state and add merge with payload
      return action.payload;
    default:
      return state;
  }
}
