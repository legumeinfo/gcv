import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import { GeneLoc } from "../models/gene-loc.model";

// interface that MacroChromosome implements
export interface State {
  genes: string[];
  locations: GeneLoc[];
  families: string[];
  length: number;
}

export function reducer(state, action: macroChromosomeActions.Actions): State {
  switch (action.type) {
    case macroChromosomeActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
