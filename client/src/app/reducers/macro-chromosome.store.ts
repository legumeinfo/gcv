import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import { MacroChromosome } from "../models/macro-chromosome.model";

export interface State {
  chromosome: MacroChromosome;
  loaded: boolean;
  loading: boolean;
}

export const initialState: State = {
  chromosome: undefined,
  loaded: false,
  loading: false,
};

export function reducer(
  state = initialState,
  action: macroChromosomeActions.Actions
): State {
  switch (action.type) {
    case macroChromosomeActions.GET:
      return {
        ...state,
        loading: true,
      };
    case macroChromosomeActions.GET_SUCCESS:
      return {
        ...action.payload,
        loading: false,
        loaded: true,
      };
    case macroChromosomeActions.GET_FAILURE:
      return {
        ...state,
        loading: false,
        loaded: false,
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
