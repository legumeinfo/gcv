import { Action } from "@ngrx/store";
import { Group } from "../models/group.model";

export const INIT = "[GLOBAL_PLOTS] INIT";
export const GET = "[GLOBAL_PLOTS] GET_SUCCESS";
export const GET_SUCCESS = "[GLOBAL_PLOTS] ADD_MANY";
export const SELECT = "[GLOBAL_PLOTS] SELECT";

export class Init implements Action {
  readonly type = INIT;
}

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {reference: Group, track: Group}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {plots: Group}) { }
}

export class Select implements Action {
  readonly type = SELECT;
  constructor(public payload: {id: string}) { }
}

export type Actions = Init | Get | GetSuccess | Select;
