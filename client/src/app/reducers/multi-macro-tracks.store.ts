import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as multiMacroTrackActions from "../actions/multi-macro-tracks.actions";
import { MacroTracks } from "../models/macro-tracks.model";

export interface State {
  correlationID: number;
  multiMacroTracks: MacroTracks[];
}

export const initialState: State = {
  correlationID: 0,
  multiMacroTracks: undefined,
};

export function reducer(
  state = initialState,
  action: multiMacroTrackActions.Actions
): State {
  switch (action.type) {
    case multiMacroTrackActions.NEW:
      return {
        correlationID: action.correlationID,
        multiMacroTracks: [],
      };
    case multiMacroTrackActions.ADD_CHROMOSOME:
    {
      // request is outdated
      if (state.correlationID !== action.correlationID) {
        return state;
      }
      // TODO: should add source to tracks so we don't merge same chromosome
      // from different sources
      const multiMacroTracks = state.multiMacroTracks;
      const newMacroTracks = action.payload;
      const chromosomes = multiMacroTracks.map((c) => c.chromosome);
      const i = chromosomes.indexOf(newMacroTracks.chromosome);
      // a track already exists for the chromosome
      if (i !== -1) {
        return state;
      }
      // merge track with existing track
      return {
        correlationID: state.correlationID,
        multiMacroTracks: multiMacroTracks.concat([newMacroTracks]),
      };
    }
    case multiMacroTrackActions.ADD_TRACKS:
    {
      // request is outdated
      if (state.correlationID !== action.correlationID) {
        return state;
      }
      // TODO: should add source to tracks so we don't merge same chromosome
      // from different sources
      const multiMacroTracks = state.multiMacroTracks;
      const target = action.payload.chromosome;
      const chromosomes = multiMacroTracks.map((c) => c.chromosome);
      const i = chromosomes.indexOf(target);
      // a track doesn't exist for the target chromosome
      if (i === -1) {
        return state;
      }
      // merge track with existing track
      const macroTracks = multiMacroTracks[i];
      const updatedTracks = new MacroTracks();
      updatedTracks.source = macroTracks.source;
      updatedTracks.genus = macroTracks.genus;
      updatedTracks.species = macroTracks.species;
      updatedTracks.chromosome = macroTracks.chromosome;
      updatedTracks.length = macroTracks.length;
      updatedTracks.tracks = macroTracks.tracks.concat(action.payload.tracks);
      return {
        correlationID: state.correlationID,
        multiMacroTracks: multiMacroTracks.slice(0, i).concat(
          [updatedTracks],
          multiMacroTracks.slice(i + 1)
        ),
      };
    }
    default:
      return state;
  }
}

export const getMultiMacroTracksState = createFeatureSelector<State>("multiMacroTracks");

export const getMultiMacroTracks = createSelector(
  getMultiMacroTracksState,
  (state) => state.multiMacroTracks,
);
