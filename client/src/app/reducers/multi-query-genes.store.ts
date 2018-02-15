import * as multiQueryGeneActions from "../actions/multi-query-genes.actions";

export interface State {
  genes: string[];
}

export function reducer(state, action: multiQueryGeneActions.Actions): State {
  switch (action.type) {
    case multiQueryGeneActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
