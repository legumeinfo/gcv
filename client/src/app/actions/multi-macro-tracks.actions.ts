import { Action } from "@ngrx/store";
import { BlockParams } from "../models/block-params.model";
import { MacroChromosome } from "../models/macro-chromosome.model";
import { MacroTrack } from "../models/macro-track.model";

export const INIT = "[MULTI_MACRO_TRACKS] INIT";
export const GET = "[MULTI_MACRO_TRACKS] GET";
export const GET_SUCCESS = "[MULTI_MACRO_TRACKS] GET_SUCCESS";
export const GET_FAILURE = "[MULTI_MACRO_TRACKS] GET_FAILURE";

export class Init implements Action {
  readonly type = INIT;
}

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {
    query: MacroChromosome,
    params: BlockParams,
    targets: string[],
    sources: string[],
  }) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {chromosome: string, tracks: MacroTrack[]}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {error: any, source: string}) { }
}

export type Actions = Init | Get | GetSuccess | GetFailure;
