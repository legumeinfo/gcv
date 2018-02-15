import * as clusteredMicroTrackActions from "../actions/clustered-micro-tracks.actions";
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
  action: clusteredMicroTrackActions.Actions,
): State {
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
