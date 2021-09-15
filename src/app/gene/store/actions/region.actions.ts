import { Action } from '@ngrx/store';
import { Region } from '@gcv/gene/models';

export const GET = '[REGION] GET';
export const GET_SUCCESS = '[REGION] GET_SUCCESS';
export const GET_FAILURE = '[REGION] GET_FAILURE';

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {chromosome: string, start: number, stop: number, source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {region: Region}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {chromosome: string, start: number, stop: number, source: string}) { }
}

export type Actions = Get | GetSuccess | GetFailure;
