import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as alignmentParamActions from "../actions/alignment-params.actions";
import { AlignmentParams } from "../models/alignment-params.model";

export interface State {
  alignmentParams: AlignmentParams;
}

export const initialState: State = {alignmentParams: new AlignmentParams()};

export function reducer(
  state = initialState,
  action: alignmentParamActions.Actions,
): State {
  switch (action.type) {
    case alignmentParamActions.NEW:
      return {alignmentParams: action.payload};
    default:
      return state;
  }
}

export const getAlignmentParamsState = createFeatureSelector<State>("alignmentParams");

export const getAlignmentParams = createSelector(
  getAlignmentParamsState,
  (state) => state.alignmentParams,
);
