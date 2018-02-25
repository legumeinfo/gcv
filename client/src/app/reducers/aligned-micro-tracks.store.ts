import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as alignedMicroTrackActions from "../actions/aligned-micro-tracks.actions";
import { MicroTracks } from "../models/micro-tracks.model";

export interface State {
  alignedMicroTracks: MicroTracks;
}

export const initialState: State = {alignedMicroTracks: new MicroTracks()};

export function reducer(
  state = initialState,
  action: alignedMicroTrackActions.Actions,
): State {
  switch (action.type) {
    case alignedMicroTrackActions.NEW:
      return initialState;
    case alignedMicroTrackActions.ADD:
      // merge new micro tracks with existing micro tracks non-destructively
      const microTracks = state.alignedMicroTracks;
      const updatedMicroTracks = new MicroTracks();
      const familyIDs = new Set(microTracks.families.map((f) => f.id));
      const newFamilies = [];
      for (const f of action.payload.families) {
        if (!familyIDs.has(f.id)) {
          newFamilies.push(f);
        }
      }
      updatedMicroTracks.families = microTracks.families.concat(newFamilies);
      updatedMicroTracks.groups = microTracks.groups.concat(action.payload.groups);
      return {alignedMicroTracks: updatedMicroTracks};
    default:
      return state;
  }
}

export const getAlignedMicroTracksState = createFeatureSelector<State>("alignedMicroTracks");

export const getAlignedMicroTracks = createSelector(
  getAlignedMicroTracksState,
  (state) => state.alignedMicroTracks,
);
