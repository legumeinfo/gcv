import * as alignedMicroTrackActions from "../actions/aligned-micro-tracks.actions";
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
  action: alignedMicroTrackActions.Actions,
): State {
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
