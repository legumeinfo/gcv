import { Action } from "@ngrx/store";
import { Group } from "../../models";

export const GET = "[SEARCH_QUERY_TRACK] GET";
export const GET_SUCCESS = "[SEARCH_QUERY_TRACK] GET_SUCCESS";
export const GET_FAILURE = "[SEARCH_QUERY_TRACK] GET_FAILURE";

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {query: {source: string, gene: string}, neighbors: number}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {track: Group}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: any) { }
}

export type Actions = Get | GetSuccess | GetFailure;
