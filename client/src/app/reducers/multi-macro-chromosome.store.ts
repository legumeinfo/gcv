import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as multiMacroChromosomeActions from "../actions/multi-macro-chromosome.actions";
import { MacroChromosome } from "../models/macro-chromosome.model";

export interface State {
  correlationID: number;
  multiMacroChromosome: MacroChromosome[];
  newMultiMacroChromosome: MacroChromosome;
}

export const initialState: State = {
  correlationID: 0,
  multiMacroChromosome: undefined,
  newMultiMacroChromosome: undefined,
};

export function reducer(
  state = initialState,
  action: multiMacroChromosomeActions.Actions
): State {
  switch (action.type) {
    case multiMacroChromosomeActions.NEW:
      return {
        correlationID: action.correlationID,
        multiMacroChromosome: [],
        newMultiMacroChromosome: undefined,
      };
    case multiMacroChromosomeActions.ADD:
      if (state.correlationID !== action.correlationID) {
        return state;
      }
      const chromosomes = state.multiMacroChromosome.map((c) => c.name);
      if (chromosomes.indexOf(action.payload.name) !== -1) {
        return state;
      }
      return {
        correlationID: state.correlationID,
        multiMacroChromosome: state.multiMacroChromosome.concat([action.payload]),
        newMultiMacroChromosome: action.payload,
      };
    default:
      return state;
  }
}

export const getMultiMacroChromosomeState = createFeatureSelector<State>("multiMacroChromosome");

export const getMultiMacroChromosome = createSelector(
  getMultiMacroChromosomeState,
  (state) => state.multiMacroChromosome,
);

export const getNewMultiMacroChromosome = createSelector(
  getMultiMacroChromosomeState,
  (state) => state.newMultiMacroChromosome,
);

export const getCorrelationID = createSelector(
  getMultiMacroChromosomeState,
  (state) => state.correlationID,
);
