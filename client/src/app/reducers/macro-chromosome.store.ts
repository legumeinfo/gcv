import * as macroChromosomeActions from "../actions/macro-chromosome.actions";

export function reducer(state, action: macroChromosomeActions.Actions) {
  switch (action.type) {
    case macroChromosomeActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
