import { Action } from "@ngrx/store";
import { MacroChromosome } from "../models/macro-chromosome.model";

export const NEW = "MULTI_[MACRO_CHROMOSOME] NEW";
export const ADD = "MULTI_[MACRO_CHROMOSOME] ADD";

export class New implements Action {
  readonly type = NEW;
  constructor(public correlationID: number) { }
}

export class Add implements Action {
  readonly type = ADD;
  constructor(public correlationID: number, public payload: MacroChromosome) { }
}

export type Actions = New | Add;
