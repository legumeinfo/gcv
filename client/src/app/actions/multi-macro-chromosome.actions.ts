import { Action } from "@ngrx/store";
import { MacroChromosome } from "../models/macro-chromosome.model";

export const INIT = "[MULTI_MACRO_CHROMOSOME] INIT";
export const GET = "[MULTI_MACRO_CHROMOSOME] GET";
export const GET_SUCCESS = "[MULTI_MACRO_CHROMOSOME] GET_SUCCESS";
export const GET_FAILURE = "[MULTI_MACRO_CHROMOSOME] GET_FAILURE";

export class Init implements Action {
  readonly type = INIT;
}

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {chromosomes: {name: string, genus: string, species: string}[], source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {chromosome: MacroChromosome, source: string}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {error: any, source: string}) { }
}

export type Actions = Init | Get | GetSuccess | GetFailure;
