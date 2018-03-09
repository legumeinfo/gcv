import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
import { Group } from "../models/group.model";

export interface State {
  track: Group;
  loaded: boolean;
  loading: boolean;
}

export const initialState: State = {
  track: undefined,
  loaded: true,
  loading: false,
};

export function reducer(
  state = initialState,
  action: searchQueryTrackActions.Actions,
): State {
  switch (action.type) {
    case searchQueryTrackActions.GET:
      return {
        ...initialState,
        loading: true,
      };
    case searchQueryTrackActions.GET_SUCCESS:
      return {
        ...action.payload,
        loading: false,
        loaded: true,
      };
    case searchQueryTrackActions.GET_FAILURE:
      return {
        ...state,
        loading: false,
        loaded: false,
      };
    default:
      return state;
  }
}

export const getSearchQueryTrackState = createFeatureSelector<State>("searchQueryTrack");

export const getSearchQueryTrack = createSelector(
  getSearchQueryTrackState,
  (state) => state.track,
);

export const getSearchQueryChromosome = createSelector(
  getSearchQueryTrackState,
  (state) => {
    const track = state.track;
    if (track === undefined) {
      return undefined;
    }
    return track.chromosome_name;
  },
);
