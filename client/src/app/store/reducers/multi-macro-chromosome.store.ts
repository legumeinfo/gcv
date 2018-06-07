import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as multiMacroChromosomeActions from "../actions/multi-macro-chromosome.actions";
import { MacroChromosome } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

const adapter = createEntityAdapter<MacroChromosome>({
  selectId: (e) => e.name,
});

export interface State extends EntityState<MacroChromosome> {
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
  action: multiMacroChromosomeActions.Actions
): State {
  switch (action.type) {
    case multiMacroChromosomeActions.INIT:
      return initialState;
    case multiMacroChromosomeActions.GET:
      return {
        ...state,
        loading: state.loading.concat([action.payload.source]),
      };
    case multiMacroChromosomeActions.GET_SUCCESS:
    {
      const source = action.payload.source;
      return adapter.addOne(
        action.payload.chromosome,
        {
          ...state,
          loaded: state.loaded.concat(source),
          loading: state.loading.filter((s) => s !== source),
        },
      );
    }
    case multiMacroChromosomeActions.GET_FAILURE:
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

export const getMultiMacroChromosomeState = createFeatureSelector<State>("multiMacroChromosome");

export const getMultiMacroChromosomes = createSelector(
  getMultiMacroChromosomeState,
  (state) => Object.values(state.entities),
);
