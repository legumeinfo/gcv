import * as alignmentParamActions from "../actions/alignment-params.actions";
import { AlignmentParams } from "../models/alignment-params.model";

// interface that AlignmentParams implements
export interface State {
  algorithm: string;
  match: number;
  mismatch: number;
  gap: number;
  score: number;
  threshold: number;
}

export function reducer(
  state = new AlignmentParams(),
  action: alignmentParamActions.Actions,
): State {
  switch (action.type) {
    case alignmentParamActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
