import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
import { Group } from "../models/group.model";

export interface State {
  track: Group;
  failed: boolean;
  loaded: boolean;
  loading: string;
}

export const initialState: State = {
  track: undefined,
  failed: false,
  loaded: false,
  loading: "",
};

export function reducer(
  state = initialState,
  action: searchQueryTrackActions.Actions,
): State {
  switch (action.type) {
    case searchQueryTrackActions.GET:
      return {
        ...initialState,
        loading: action.payload.query.source,
      };
    case searchQueryTrackActions.GET_SUCCESS:
      return {
        ...state,
        ...action.payload,
        loaded: true,
      };
    case searchQueryTrackActions.GET_FAILURE:
      return {
        ...state,
        failed: true,
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

export const getSearchQueryTrackLoadState = createSelector(
  getSearchQueryTrackState,
  (state) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  }
)
