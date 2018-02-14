import { Action } from "@ngrx/store";
import { BlockParams } from "../models/block-params.model";

export const NEW = "[BLOCK_PARAMS] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: BlockParams) { }
}

export type Actions = New;
