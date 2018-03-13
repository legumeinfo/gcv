import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as multiMacroChromosomeActions from "../actions/multi-macro-chromosome.actions";
import { MacroChromosome } from "../models/macro-chromosome.model";

export interface State {
  chromosomes: MacroChromosome[];
  loadCount: number;
  loading: boolean;
}

export const initialState: State = {
  chromosomes: [],
  loadCount: 0,
  loading: false,
};

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
        loadCount: state.loadCount + 1,
        loading: true,
      };
    case multiMacroChromosomeActions.GET_SUCCESS:
      return {
        chromosomes: state.chromosomes.concat([action.payload.chromosome]),
        loadCount: state.loadCount - 1,
        loading: state.loadCount > 1,
      };
    default:
      return state;
  }
}

export const getMultiMacroChromosomeState = createFeatureSelector<State>("multiMacroChromosome");

export const getMultiMacroChromosomes = createSelector(
  getMultiMacroChromosomeState,
  (state) => state.chromosomes,
);
