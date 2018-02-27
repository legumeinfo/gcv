import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as macroTrackActions from "../actions/macro-tracks.actions";
import { MacroTracks } from "../models/macro-tracks.model";

export interface State {
  correlationID: number;
  macroTracks: MacroTracks;
}

export const initialState: State = {
  correlationID: 0,
  macroTracks: undefined,
};

export function reducer(
  state = initialState,
  action: macroTrackActions.Actions
): State {
  switch (action.type) {
    case macroTrackActions.NEW:
      return {
        correlationID: action.correlationID,
        macroTracks: action.payload,
      };
    case macroTrackActions.ADD:
      if (state.correlationID !== action.correlationID) {
        return state;
      }
      // merge new macro tracks with existing macro track non-destructively
      const macroTracks = state.macroTracks;
      const newMacroTracks = new MacroTracks();
      newMacroTracks.chromosome = macroTracks.chromosome;
      newMacroTracks.length = macroTracks.length;
      newMacroTracks.tracks = macroTracks.tracks.concat(action.payload);
      return {
        correlationID: state.correlationID,
        macroTracks: newMacroTracks,
      };
    default:
      return state;
  }
}

export const getMacroTracksState = createFeatureSelector<State>("macroTracks");

export const getMacroTracks = createSelector(
  getMacroTracksState,
  (state) => state.macroTracks,
);
