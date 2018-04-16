import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import { MacroChromosome } from "../models/macro-chromosome.model";

export interface State {
  chromosome: MacroChromosome;
  failed: boolean;
  loaded: boolean;
  loading: string;
}

export const initialState: State = {
  chromosome: undefined,
  failed: false,
  loaded: false,
  loading: "",
};

export function reducer(
  state = initialState,
  action: macroChromosomeActions.Actions
): State {
  switch (action.type) {
    case macroChromosomeActions.GET:
      return {
        ...initialState,
        loading: action.payload.source,
      };
    case macroChromosomeActions.GET_SUCCESS:
      return {
        ...state,
        ...action.payload,
        loaded: true,
      };
    case macroChromosomeActions.GET_FAILURE:
      return {
        ...state,
        failed: true,
      };
    default:
      return state;
  }
}

export const getMacroChromosomeState = createFeatureSelector<State>("macroChromosome");

export const getMacroChromosome = createSelector(
  getMacroChromosomeState,
  (state) => state.chromosome,
);

export const getMacroChromosomeLoadState = createSelector(
  getMacroChromosomeState,
  (state) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  }
)
