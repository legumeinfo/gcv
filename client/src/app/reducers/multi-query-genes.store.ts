import * as multiQueryGeneActions from "../actions/multi-query-genes.actions";

export function reducer(state, action: multiQueryGeneActions.Actions) {
  switch (action.type) {
    case multiQueryGeneActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
