import { Action } from '@ngrx/store';
import { Plot, Track } from '@gcv/gene/models';

export const GET = '[PLOT] GET';
export const GET_SUCCESS = '[PLOT] GET_SUCCESS';
export const GET_FAILURE = '[PLOT] GET_FAILURE';

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {tracks: Track[], name: string, source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {plots: Plot[]}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {tracks: Track[], name: string, source: string}) { }
}

export type Actions = Get | GetSuccess | GetFailure;