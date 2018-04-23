import { createEntityAdapter, EntityState, Update } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as multiMacroTrackActions from "../actions/multi-macro-tracks.actions";
import { MacroTracks } from "../models/macro-tracks.model";

declare var Object: any;  // because TypeScript doesn't support Object.values

const adapter = createEntityAdapter<MacroTracks>({
  selectId: (e) => e.chromosome,
});

export interface State extends EntityState<MacroTracks> {
  failed: string[];
  loaded: string[];
  loading: string[];
}

const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: multiMacroTrackActions.Actions
): State {
  switch (action.type) {
    case multiMacroTrackActions.INIT:
      return initialState;
    case multiMacroTrackActions.GET:
    {
      // TODO: should use chromosome name and some combination of genus, species,
      // and source to determine if the chromosome already exists
      const chromosome = action.payload.query;
      const macroTracks = {
        chromosome: chromosome.name,
        length: chromosome.length,
        genus: chromosome.genus,
        species: chromosome.species,
        source: chromosome.source,
        tracks: [],
      };
      return adapter.addOne(
        macroTracks,
        {
          ...state,
          loading: state.loading.concat(action.payload.sources),
        },
      );
    }
    case multiMacroTrackActions.GET_SUCCESS:
    {
      if (!(action.payload.chromosome in state.entities)) {
        return state;
      }
      const macroTracks = state.entities[action.payload.chromosome];
      const changes: Update<MacroTracks> = {
        id : macroTracks.chromosome,
        changes: {
          tracks: macroTracks.tracks.concat(action.payload.tracks),
        },
      };
      const source = action.payload.source;
      return adapter.updateOne(
        changes,
        {
          ...state,
          loaded: state.loaded.concat(source),
          loading: state.loading.filter((s) => s !== source),
        },
      );
    }
    case multiMacroTrackActions.GET_FAILURE:
    {
      const source = action.payload.source;
      return {
        ...state,
        failed: state.failed.concat(source),
        loading: state.loading.filter((s) => s !== source),
      };
    }
    default:
      return state;
  }
}

export const getMultiMacroTracksState = createFeatureSelector<State>("multiMacroTracks");

export const getMultiMacroTracks = createSelector(
  getMultiMacroTracksState,
  (state) => Object.values(state.entities),
);
