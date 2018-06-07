import { Action } from "@ngrx/store";
import { Group, MicroTracks, QueryParams } from "../../models";

export const GET_SEARCH = "[MICRO_TRACKS] GET_SEARCH";
export const GET_MULTI = "[MICRO_TRACKS] GET_MULTI";
export const GET_SEARCH_SUCCESS = "[MICRO_TRACKS] GET_SEARCH_SUCCESS";
export const GET_MULTI_SUCCESS = "[MICRO_TRACKS] GET_MULTI_SUCCESS";
export const GET_SEARCH_FAILURE = "[MICRO_TRACKS] GET_SEARCH_FAILURE";
export const GET_MULTI_FAILURE = "[MICRO_TRACKS] GET_MULTI_FAILURE";

export class GetSearch implements Action {
  readonly type = GET_SEARCH;
  constructor(public payload: {query: Group, params: QueryParams, sources: string[]}) { }
}

export class GetMulti implements Action {
  readonly type = GET_MULTI;
  constructor(public payload: {query: string[], neighbors: number, sources: string[]}) { }
}

export class GetSearchSuccess implements Action {
  readonly type = GET_SEARCH_SUCCESS;
  constructor(public payload: {tracks: MicroTracks, source: string}) { }
}

export class GetMultiSuccess implements Action {
  readonly type = GET_MULTI_SUCCESS;
  constructor(public payload: {tracks: MicroTracks, source: string}) { }
}

export class GetSearchFailure implements Action {
  readonly type = GET_SEARCH_FAILURE;
  constructor(public payload: {error: any, source: string}) { }
}

export class GetMultiFailure implements Action {
  readonly type = GET_MULTI_FAILURE;
  constructor(public payload: {error: any, source: string}) { }
}

export type Actions =
  GetSearch |
  GetMulti |
  GetSearchSuccess |
  GetMultiSuccess |
  GetSearchFailure |
  GetMultiFailure;
