import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as clusteredMicroTrackActions from "../actions/clustered-micro-tracks.actions";
import { MicroTracks } from "../models/micro-tracks.model";

export interface State {
  clusteredMicroTracks: MicroTracks;
}

export const initialState: State = {clusteredMicroTracks: new MicroTracks()};

export function reducer(
  state = initialState,
  action: clusteredMicroTrackActions.Actions,
): State {
  switch (action.type) {
    case clusteredMicroTrackActions.NEW:
      return initialState;
    case clusteredMicroTrackActions.ADD:
      // merge new micro tracks with existing micro tracks non-destructively
      const microTracks = state.clusteredMicroTracks;
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
      return {clusteredMicroTracks: updatedMicroTracks};
    default:
      return state;
  }
}

export const getClusteredMicroTracksState = createFeatureSelector<State>("clusteredMicroTracks");

export const getClusteredMicroTracks = createSelector(
  getClusteredMicroTracksState,
  (state) => state.clusteredMicroTracks,
);
