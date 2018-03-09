import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as macroTrackActions from "../actions/macro-tracks.actions";
import { MacroTracks } from "../models/macro-tracks.model";

export interface State {
  tracks: MacroTracks;
  loaded: string[];
  loading: string[];
}

export const initialState: State = {
  tracks: undefined,
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
        tracks: {
          chromosome: action.payload.query.name,
          length: action.payload.query.length,
          tracks: [],
        },
        loaded: [],
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
      return {...state, loading};
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
