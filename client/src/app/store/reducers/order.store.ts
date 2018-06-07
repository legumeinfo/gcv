import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as orderFilterActions from "../actions/order-filter.actions";
import { ORDER_ALGORITHMS } from "../../algorithms";
import { Algorithm } from "../../models";

export interface State {
  orderAlgorithm: Algorithm;
}

export const initialState: State = {orderAlgorithm: ORDER_ALGORITHMS[0]};

export function reducer(
  state = initialState,
  action: orderFilterActions.Actions
): State {
  switch (action.type) {
    case orderFilterActions.NEW:
      return {orderAlgorithm: action.payload};
    default:
      return state;
  }
};

export const getOrderFilterState = createFeatureSelector<State>("orderFilter");

export const getOrderFilterAlgorithm = createSelector(
  getOrderFilterState,
  (state) => state.orderAlgorithm,
);
