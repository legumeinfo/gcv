import * as queryParamActions from "../actions/query-params.actions";
import { QueryParams } from "../models/query-params.model";

export function reducer(
  state = new QueryParams(),
  action: queryParamActions.Actions,
) {
  switch (action.type) {
    case queryParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
