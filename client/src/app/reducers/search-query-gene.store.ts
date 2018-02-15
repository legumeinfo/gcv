import * as searchQueryGeneActions from "../actions/search-query-gene.actions";

export interface State {
  name: string;
  source: string;
}

export function reducer(state, action: searchQueryGeneActions.Actions): State {
  switch (action.type) {
    case searchQueryGeneActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
