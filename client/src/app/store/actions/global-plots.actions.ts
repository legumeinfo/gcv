import { Action } from "@ngrx/store";
import { Group } from "../../models";

export const INIT = "[GLOBAL_PLOTS] INIT";
export const GET = "[GLOBAL_PLOTS] GET";
export const GET_SUCCESS = "[GLOBAL_PLOTS] GET_SUCCESS";
export const GET_FAILURE = "[GLOBAL_PLOTS] GET_FAILURE";
export const SELECT = "[GLOBAL_PLOTS] SELECT";
export const GET_OR_SELECT = "[GLOBAL_PLOTS] GET_OR_SELECT";

export class Init implements Action {
  readonly type = INIT;
}

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {reference: Group, local: Group}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {plot: Group, source: string}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {source: string}) { }
}

export class Select implements Action {
  readonly type = SELECT;
  constructor(public payload: {id: string}) { }
}

export class GetOrSelect implements Action {
  readonly type = GET_OR_SELECT;
  constructor(public payload: {id: string}) { }
}

export type Actions = Init | Get | GetSuccess | GetFailure | Select | GetOrSelect;
