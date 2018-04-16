import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as multiMacroTrackActions from "../actions/multi-macro-tracks.actions";
import { MacroTracks } from "../models/macro-tracks.model";

export interface State {
  tracks: MacroTracks[];
  loadCount: number;
  loading: boolean;
}

export const initialState: State = {
  tracks: [],
  loadCount: 0,
  loading: false,
};

export function reducer(
  state = initialState,
  action: multiMacroTrackActions.Actions
): State {
  switch (action.type) {
    case multiMacroTrackActions.INIT:
      return initialState;
    case multiMacroTrackActions.GET:
      // Assumes the chromosome doesn't already exist
      // TODO: should use chromosome name and source to determine if the chromosome
      // already exists
      const chromosome = action.payload.query;
      const macroTracks = {
        chromosome: chromosome.name,
        length: chromosome.length,
        genus: chromosome.genus,
        species: chromosome.species,
        source: chromosome.source,
        tracks: [],
      };
      return {
        tracks: state.tracks.concat([macroTracks]),
        loadCount: state.loadCount + 1,
        loading: true,
      };
    case multiMacroTrackActions.GET_SUCCESS:
      const tracks = state.tracks;
      const target = action.payload.chromosome;
      const chromosomes = tracks.map((c) => c.chromosome);
      const i = chromosomes.indexOf(target);
      // a track doesn't exist for the target chromosome
      if (i === -1) {
        return state;
      }
      // merge track with existing track
      const updatedMacroTracks = {
        ...tracks[i],
        tracks: tracks[i].tracks.concat(action.payload.tracks),
      };
      return {
        tracks: tracks.map((t, j) => (j === i) ? updatedMacroTracks : t),
        loadCount: state.loadCount - 1,
        loading: state.loadCount > 1,
      };
    default:
      return state;
  }
}

export const getMultiMacroTracksState = createFeatureSelector<State>("multiMacroTracks");

export const getMultiMacroTracks = createSelector(
  getMultiMacroTracksState,
  (state) => state.tracks,
);
