import { createAction, union } from '@ngrx/store';
import { Region } from '@gcv/gene/models';

export const GET = '[REGION] GET';
export const GET_SUCCESS = '[REGION] GET_SUCCESS';
export const GET_FAILURE = '[REGION] GET_FAILURE';

export const get = createAction(
  GET,
  (payload: {
    chromosome: string;
    start: number;
    stop: number;
    source: string;
  }) => ({ payload }),
);

export const getSuccess = createAction(
  GET_SUCCESS,
  (payload: { region: Region }) => ({ payload }),
);

export const getFailure = createAction(
  GET_FAILURE,
  (payload: {
    chromosome: string;
    start: number;
    stop: number;
    source: string;
  }) => ({ payload }),
);

const all = union({ get, getSuccess, getFailure });
export type Actions = typeof all;
