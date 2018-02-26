import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
import { Group } from "../models/group.model";

export interface State {
  correlationID: number;
  searchQueryTrack: Group;
}

export const initialState: State = {correlationID: 0, searchQueryTrack: undefined};

export function reducer(
  state = initialState,
  action: searchQueryTrackActions.Actions,
): State {
  switch (action.type) {
    case searchQueryTrackActions.NEW:
      return {correlationID: action.correlationID, searchQueryTrack: action.payload};
    default:
      return state;
  }
}

export const getSearchQueryTrackState = createFeatureSelector<State>("searchQueryTrack");

export const getCorrelationID = createSelector(
  getSearchQueryTrackState,
  (state) => state.correlationID,
)

export const getSearchQueryTrack = createSelector(
  getSearchQueryTrackState,
  (state) => state.searchQueryTrack,
);
