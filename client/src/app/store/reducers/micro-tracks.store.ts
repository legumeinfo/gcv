import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as microTrackActions from "../actions/micro-tracks.actions";
import { MicroTracks } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

export interface State {
  tracks: MicroTracks;
  failed: string[];
  loaded: string[];
  loading: string[];
}

export const initialState: State = {
  tracks: new MicroTracks(),
  failed: [],
  loaded: [],
  loading: [],
}

export function reducer(
  state = initialState,
  action: microTrackActions.Actions,
): State {
  switch (action.type) {
    case microTrackActions.GET_SEARCH:
    case microTrackActions.GET_MULTI:
      return {
        ...initialState,
        loading: action.payload.sources,
      };
    case microTrackActions.GET_SEARCH_SUCCESS:
    case microTrackActions.GET_MULTI_SUCCESS:
    {
      const source = action.payload.source;
      const loading = state.loading.filter((s) => s !== source);
      if (state.loading.length === loading.length) {
        return state;
      }
      // merge new micro tracks with existing micro tracks non-destructively
      const tracks = action.payload.tracks;
      return {
        ...state,
        tracks: {
          // ensure that list of families is unique
          families: Object.values(state.tracks.families.concat(tracks.families)
            .reduce((familyMap, family) => {
              familyMap[family.id] = family;
              return familyMap;
            }, {})
          ),
          groups: state.tracks.groups.concat(tracks.groups),
        },
        loaded: state.loaded.concat(source),
        loading,
      };
    }
    case microTrackActions.GET_SEARCH_FAILURE:
    case microTrackActions.GET_MULTI_FAILURE:
    {
      const source = action.payload.source;
      const loading = state.loading.filter((s) => s !== source);
      if (state.loading.length === loading.length) {
        return state;
      }
      return {
        ...state,
        failed: state.failed.concat(source),
        loading
      };
    }
    default:
      return state;
  }
}

export const getMicroTracksState = createFeatureSelector<State>("microTracks");

export const getMicroTracks = createSelector(
  getMicroTracksState,
  (state) => state.tracks,
);

export const getMicroTracksLoadState = createSelector(
  getMicroTracksState,
  (state) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  }
)
