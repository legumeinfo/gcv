import { Action } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';

export const CLEAR = '[CHROMOSOME] CLEAR';
export const GET = '[CHROMOSOME] GET';
export const GET_SUCCESS = '[CHROMOSOME] GET_SUCCESS';
export const GET_FAILURE = '[CHROMOSOME] GET_FAILURE';

export class Clear implements Action {
  readonly type = CLEAR;
}

export class Get implements Action {
  readonly type = GET;
  readonly id = counter.getCount();
  constructor(public payload: {name: string, source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {chromosome: Track}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {name: string, source: string}) { }
}

export type Actions = Clear | Get | GetSuccess | GetFailure;
