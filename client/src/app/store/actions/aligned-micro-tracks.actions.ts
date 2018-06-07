import { Action } from "@ngrx/store";
import { AlignmentParams, Group, MicroTracks } from "../../models";

export const INIT = "[ALIGNED_MICRO_TRACKS] INIT";
export const GET_PAIRWISE = "[ALIGNED_MICRO_TRACKS] GET_PAIRWISE";
export const GET_MULTI = "[ALIGNED_MICRO_TRACKS] GET_MULTI";
export const GET_PAIRWISE_SUCCESS = "[ALIGNED_MICRO_TRACKS] GET_PAIRWISE_SUCCESS";
export const GET_MULTI_SUCCESS = "[ALIGNED_MICRO_TRACKS] GET_SEARCH_SUCCESS";

export class Init implements Action {
  readonly type = INIT;
  constructor(public payload?: {reference: Group}) { }
}

export class GetPairwise implements Action {
  readonly type = GET_PAIRWISE;
  constructor(public payload: {tracks: MicroTracks, params: AlignmentParams}) { }
}

export class GetMulti implements Action {
  readonly type = GET_MULTI;
  constructor(public payload: {tracks: MicroTracks}) { }
}

export class GetPairwiseSuccess implements Action {
  readonly type = GET_PAIRWISE_SUCCESS;
  constructor(public payload: {tracks: MicroTracks}) { }
}

export class GetMultiSuccess implements Action {
  readonly type = GET_MULTI_SUCCESS;
  constructor(public payload: {tracks: MicroTracks}) { }
}

export type Actions =
  Init |
  GetPairwise |
  GetMulti |
  GetPairwiseSuccess |
  GetMultiSuccess;
