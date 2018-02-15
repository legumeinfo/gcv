import * as microTrackActions from "../actions/micro-tracks.actions";
import { Family } from "../models/family.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";

// interface that MicroTracks implements
export interface State {
  families: Family[];
  groups: Group[];
}

export function reducer(
  state = new MicroTracks(),
  action: microTrackActions.Actions,
): State {
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
