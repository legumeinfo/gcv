import * as blockParamActions from "../actions/block-params.actions";
import { BlockParams } from "../models/block-params.model";

// interface that BlockParams implements
export interface State {
  bmatched: number;
  bintermediate: number;
  bmask: number;
}

export function reducer(
  state = new BlockParams(),
  action: blockParamActions.Actions,
): State {
  switch (action.type) {
    case blockParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
