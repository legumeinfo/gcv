import { Action } from "@ngrx/store";
import { Gene } from "../../models";

export const GET = "[GENE] GET";
export const GET_SUCCESS = "[GENE] GET_SUCCESS";
export const GET_FAILURE = "[GENE] GET_FAILURE";

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {names: string[], source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {genes: Gene[]}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {names: string[], source: string}) { }
}

export type Actions = Get | GetSuccess | GetFailure;
