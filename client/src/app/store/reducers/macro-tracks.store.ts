import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as macroTrackActions from "../actions/macro-tracks.actions";
import { MacroTracks } from "../../models";

export interface State {
  tracks: MacroTracks;
  failed: string[];
  loaded: string[];
  loading: string[];
}

export const initialState: State = {
  tracks: undefined,
  failed: [],
  loaded: [],
  loading: [],
};

export function reducer(
  state = initialState,
  action: macroTrackActions.Actions
): State {
  switch (action.type) {
    case macroTrackActions.GET:
      return {
        ...initialState,
        tracks: {
          chromosome: action.payload.query.name,
          length: action.payload.query.length,
          tracks: [],
        },
        loading: action.payload.sources,
      };
    case macroTrackActions.GET_SUCCESS:
    {
      const source = action.payload.source;
      const loading = state.loading.filter((s) => s !== source);
      if (state.loading.length === loading.length) {
        return state;
      }
      // merge new macro tracks with existing macro tracks non-destructively
      const tracks = action.payload.tracks;
      return {
        ...state,
        tracks: {
          ...state.tracks,
          tracks: state.tracks.tracks.concat(action.payload.tracks),
        },
        loaded: state.loaded.concat(source),
        loading,
      };
    }
    case macroTrackActions.GET_FAILURE:
    {
      const source = action.payload.source;
      const loading = state.loading.filter((s) => s !== source);
      if (state.loading.length === loading.length) {
        return state;
      }
      return {
        ...state,
        failed: state.failed.concat(source),
        loading,
      };
    }
    default:
      return state;
  }
}

export const getMacroTracksState = createFeatureSelector<State>("macroTracks");

export const getMacroTracks = createSelector(
  getMacroTracksState,
  (state) => state.tracks,
);

export const getMacroTracksLoadState = createSelector(
  getMacroTracksState,
  (state) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  }
)
