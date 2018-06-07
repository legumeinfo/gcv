import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as alignedMicroTracksActions from "../actions/aligned-micro-tracks.actions";
import { Group, MicroTracks } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

export interface State {
  reference: Group;
  tracks: MicroTracks;
  loadCount: number;
  loading: boolean;
}

export const initialState: State = {
  reference: undefined,
  tracks: new MicroTracks(),
  loadCount: 0,
  loading: false,
};

export function reducer(
  state = initialState,
  action: alignedMicroTracksActions.Actions,
): State {
  switch (action.type) {
    case alignedMicroTracksActions.INIT:
      if (action.payload !== undefined) {
        return {
          ...initialState,
          reference: action.payload.reference,
          tracks: {
            ...initialState.tracks,
            groups: [action.payload.reference],
          },
        };
      }
      return initialState;
    case alignedMicroTracksActions.GET_PAIRWISE:
    case alignedMicroTracksActions.GET_MULTI:
      return {
        ...state,
        loadCount: state.loadCount + 1,
        loading: true,
      };
    case alignedMicroTracksActions.GET_PAIRWISE_SUCCESS:
    case alignedMicroTracksActions.GET_MULTI_SUCCESS:
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
        loadCount: state.loadCount - 1,
        loading: state.loadCount > 1,
      };
    default:
      return state;
  }
}

export const getAlignedMicroTracksState = createFeatureSelector<State>("alignedMicroTracks");

export const getAlignmentReference = createSelector(
  getAlignedMicroTracksState,
  (state) => state.reference,
);

export const getAlignedMicroTracks = createSelector(
  getAlignedMicroTracksState,
  (state) => state.tracks,
);
