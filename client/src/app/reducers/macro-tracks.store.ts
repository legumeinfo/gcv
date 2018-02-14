import * as macroTrackActions from "../actions/macro-tracks.actions";

export function reducer(state, action: macroTrackActions.Actions) {
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
