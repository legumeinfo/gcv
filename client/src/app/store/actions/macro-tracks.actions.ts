import { Action } from "@ngrx/store";
import { BlockParams, MacroChromosome, MacroTrack } from "../../models";

export const GET = "[MACRO_TRACKS] GET";
export const GET_SUCCESS = "[MACRO_TRACKS] GET_SUCCESS";
export const GET_FAILURE = "[MACRO_TRACKS] GET_FAILURE";

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {
    query: MacroChromosome,
    params: BlockParams,
    sources: string[],
  }) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {tracks: MacroTrack[], source: string}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {error: any, source: string}) { }
}

export type Actions = Get | GetSuccess | GetFailure;
