import { Action } from "@ngrx/store";

export const NEW = "[MULTI_QUERY_GENES] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: {genes: string[]}) { }
}

export type Actions = New;
