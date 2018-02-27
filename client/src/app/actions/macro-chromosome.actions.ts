import { Action } from "@ngrx/store";
import { MacroChromosome } from "../models/macro-chromosome.model";

export const NEW = "[MACRO_CHROMOSOME] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public correlationID: number, public payload: MacroChromosome) { }
}

export type Actions = New;
