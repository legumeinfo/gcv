import * as queryParamActions from "../actions/query-params.actions";
import { QueryParams } from "../models/query-params.model";

// interface that QueryParams implements
export interface State {
  neighbors: number;
  sources: string[];
  matched: number;
  intermediate: number;
}

export function reducer(
  state = new QueryParams(),
  action: queryParamActions.Actions,
): State {
  switch (action.type) {
    case queryParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
