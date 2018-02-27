import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as microTrackActions from "../actions/micro-tracks.actions";
import { MicroTracks } from "../models/micro-tracks.model";

export interface State {
  correlationID: number;
  microTracks: MicroTracks;
  newMicroTracks: MicroTracks;
}

export const initialState: State = {
  correlationID: 0,
  microTracks: new MicroTracks(),
  newMicroTracks: new MicroTracks(),
};

export function reducer(
  state = initialState,
  action: microTrackActions.Actions,
): State {
  switch (action.type) {
    case microTrackActions.NEW:
      return {
        correlationID: action.correlationID,
        microTracks: initialState.microTracks,
        newMicroTracks: initialState.newMicroTracks,
      };
    case microTrackActions.ADD:
      if (state.correlationID !== action.correlationID) {
        return state;
      }
      // merge new micro tracks with existing micro tracks non-destructively
      const microTracks = state.microTracks;
      const newMicroTracks = action.payload;
      const updatedMicroTracks = new MicroTracks();
      const familyIDs = new Set(microTracks.families.map((f) => f.id));
      const newFamilies = [];
      for (const f of newMicroTracks.families) {
        if (!familyIDs.has(f.id)) {
          newFamilies.push(f);
        }
      }
      updatedMicroTracks.families = microTracks.families.concat(newFamilies);
      updatedMicroTracks.groups = microTracks.groups.concat(newMicroTracks.groups);
      return {
        correlationID: state.correlationID,
        microTracks: updatedMicroTracks,
        newMicroTracks
      };
    default:
      return state;
  }
}

export const getMicroTracksState = createFeatureSelector<State>("microTracks");

export const getMicroTracks = createSelector(
  getMicroTracksState,
  (state) => state.microTracks,
);

export const getNewMicroTracks = createSelector(
  getMicroTracksState,
  (state) => state.newMicroTracks,
);
