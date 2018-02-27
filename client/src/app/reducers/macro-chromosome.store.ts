import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import { MacroChromosome } from "../models/macro-chromosome.model";

export interface State {
  correlationID: number;
  macroChromosome: MacroChromosome;
}

export const initialState: State = {
  correlationID: 0,
  macroChromosome: undefined,
};

export function reducer(
  state = initialState,
  action: macroChromosomeActions.Actions
): State {
  switch (action.type) {
    case macroChromosomeActions.NEW:
      return {
        correlationID: action.correlationID,
        macroChromosome: action.payload,
      };
    default:
      return state;
  }
}

export const getMacroChromosomeState = createFeatureSelector<State>("macroChromosome");

export const getMacroChromosome = createSelector(
  getMacroChromosomeState,
  (state) => state.macroChromosome,
);

export const getCorrelationID = createSelector(
  getMacroChromosomeState,
  (state) => state.correlationID,
);
