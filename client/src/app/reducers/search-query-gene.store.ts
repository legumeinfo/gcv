import * as searchQueryGeneActions from "../actions/search-query-gene.actions";

export function reducer(state, action: searchQueryGeneActions.Actions) {
  switch (action.type) {
    case searchQueryGeneActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
