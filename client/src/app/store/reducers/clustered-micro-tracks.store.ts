import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as clusteredMicroTrackActions from "../actions/clustered-micro-tracks.actions";
import { MicroTracks } from "../../models";

export interface State {
  tracks: MicroTracks;
  loaded: boolean;
  loading: boolean;
}

export const initialState: State = {
  tracks: new MicroTracks(),
  loaded: false,
  loading: false,
};

export function reducer(
  state = initialState,
  action: clusteredMicroTrackActions.Actions,
): State {
  switch (action.type) {
    case clusteredMicroTrackActions.GET:
      return {
        ...initialState,
        loading: true,
      };
    case clusteredMicroTrackActions.GET_SUCCESS:
      return {
        ...action.payload,
        loading: false,
        loaded: true,
      };
    default:
      return state;
  }
}

export const getClusteredMicroTracksState = createFeatureSelector<State>("clusteredMicroTracks");

export const getClusteredMicroTracks = createSelector(
  getClusteredMicroTracksState,
  (state) => state.tracks,
);
