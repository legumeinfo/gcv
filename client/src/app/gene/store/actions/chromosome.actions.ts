import { Action } from '@ngrx/store';
import { Track } from '@gcv/gene/models';

export const GET = '[CHROMOSOME] GET';
export const GET_SUCCESS = '[CHROMOSOME] GET_SUCCESS';
export const GET_FAILURE = '[CHROMOSOME] GET_FAILURE';

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {name: string, source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {chromosome: Track}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: any) { }
}

export type Actions = Get | GetSuccess | GetFailure;
