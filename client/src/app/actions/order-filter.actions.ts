import { Action } from "@ngrx/store";
import { Algorithm } from "../models/algorithm.model";

export const NEW = "[ORDER_FILTER] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: Algorithm) { }
}

export type Actions = New;
