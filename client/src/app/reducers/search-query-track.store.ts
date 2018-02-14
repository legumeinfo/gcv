import * as searchQueryTrackActions from "../actions/search-query-track.actions";

export function reducer(state, action: searchQueryTrackActions.Actions) {
  switch (action.type) {
    case searchQueryTrackActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
