import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as regexpFilterActions from "../actions/regexp-filter.actions";
import { Algorithm } from "../models/algorithm.model";
import { regexpAlgorithmFactory } from "../utils/regexp-algorithm-factory.util";

export interface State {
  regexpAlgorithm: Algorithm;
}

export const initialState: State = {
  regexpAlgorithm: regexpAlgorithmFactory(""),
};

export function reducer(
  state = initialState,
  action: regexpFilterActions.Actions,
): State {
  switch (action.type) {
    case regexpFilterActions.NEW:
      return {regexpAlgorithm: action.payload};
    default:
      return state;
  }
};

export const getRegexpFilterState = createFeatureSelector<State>("regexpFilter");

export const getRegexpFilterAlgorithm = createSelector(
  getRegexpFilterState,
  (state) => state.regexpAlgorithm,
);
