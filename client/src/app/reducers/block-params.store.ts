import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as blockParamActions from "../actions/block-params.actions";
import { BlockParams } from "../models/block-params.model";

export interface State {
  blockParams: BlockParams;
}

export const initialState: State = {blockParams: new BlockParams()};

export function reducer(
  state = initialState,
  action: blockParamActions.Actions,
): State {
  switch (action.type) {
    case blockParamActions.NEW:
      return {blockParams: action.payload};
    default:
      return state;
  }
}

export const getBlockParamsState = createFeatureSelector<State>("blockParams");

export const getBlockParams = createSelector(
  getBlockParamsState,
  (state) => state.blockParams,
);
