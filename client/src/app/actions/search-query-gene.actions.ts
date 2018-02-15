import { Action } from "@ngrx/store";

export const NEW = "[SEARCH_QUERY_GENE] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: {name: string, source: string}) { }
}

export type Actions = New;
