import { Action } from "@ngrx/store";

export const NEW = "[SEARCH_QUERY_GENE] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: string) { }
}

export type Actions = New;
