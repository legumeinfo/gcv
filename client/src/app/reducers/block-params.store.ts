import * as blockParamActions from "../actions/block-params.actions";
import { BlockParams } from "../models/block-params.model";

export function reducer(
  state = new BlockParams(),
  action: blockParamActions.Actions,
) {
  switch (action.type) {
    case blockParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
