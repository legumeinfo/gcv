import { Action } from "@ngrx/store";
import { Group } from "../models/group.model";

export const NEW = "[SEARCH_QUERYY_TRACK] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: Group) { }
}

export type Actions = New;
