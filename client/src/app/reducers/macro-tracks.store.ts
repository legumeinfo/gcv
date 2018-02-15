import * as macroTrackActions from "../actions/macro-tracks.actions";
import { MacroTrack } from "../models/macro-track.model";

// interface that MacroTracks implements
export interface State {
  chromosome: string;
  length: number;
  tracks: MacroTrack[];
}

export function reducer(state, action: macroTrackActions.Actions): State {
  switch (action.type) {
    case macroTrackActions.NEW:
      return action.payload;
    case macroTrackActions.ADD:
      // TODO: clone state and add merge with payload
      return action.payload;
    default:
      return state;
  }
}
