import { Action } from "@ngrx/store";
import { MacroChromosome } from "../models/macro-chromosome.model";

export const GET = "[MACRO_CHROMOSOME_TRACK] GET";
export const GET_SUCCESS = "[MACRO_CHROMOSOME_TRACK] GET_SUCCESS";
export const GET_FAILURE = "[MACRO_CHROMOSOME_TRACK] GET_FAILURE";

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {chromosome: string, source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {chromosome: MacroChromosome}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: any) { }
}

export type Actions = Get | GetSuccess | GetFailure;
