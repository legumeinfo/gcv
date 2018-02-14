import { Action } from "@ngrx/store";
import { QueryParams } from "../models/query-params.model";

export const NEW = "[QUERY_PARAMS] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: QueryParams) { }
}

export type Actions = New;
