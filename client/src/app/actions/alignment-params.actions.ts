import { Action } from "@ngrx/store";
import { AlignmentParams } from "../models/alignment-params.model";

export const NEW = "[ALIGNMENT_PARAMS] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: AlignmentParams) { }
}

export type Actions = New;
