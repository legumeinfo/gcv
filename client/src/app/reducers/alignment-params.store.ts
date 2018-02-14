import * as alignmentParamActions from "../actions/alignment-params.actions";
import { AlignmentParams } from "../models/alignment-params.model";

export function reducer(
  state = new AlignmentParams(),
  action: alignmentParamActions.Actions,
) {
  switch (action.type) {
    case alignmentParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
