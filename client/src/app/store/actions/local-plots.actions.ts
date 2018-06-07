import { Action } from "@ngrx/store";
import { Group } from "../../models";

export const INIT = "[LOCAL_PLOTS] INIT";
export const GET = "[LOCAL_PLOTS] GET";
export const GET_SUCCESS = "[LOCAL_PLOTS] GET_SUCCESS";
export const SELECT = "[LOCAL_PLOTS] SELECT";

export class Init implements Action {
  readonly type = INIT;
}

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {reference: Group, tracks: Group[]}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {plots: Group[]}) { }
}

export class Select implements Action {
  readonly type = SELECT;
  constructor(public payload: {id: string}) { }
}

export type Actions = Init | Get | GetSuccess | Select;
