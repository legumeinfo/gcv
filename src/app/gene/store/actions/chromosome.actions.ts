import { createAction, union } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';

export const CLEAR = '[CHROMOSOME] CLEAR';
export const GET = '[CHROMOSOME] GET';
export const GET_SUCCESS = '[CHROMOSOME] GET_SUCCESS';
export const GET_FAILURE = '[CHROMOSOME] GET_FAILURE';

export const clear = createAction(CLEAR);

export const get = createAction(
  GET,
  (payload: { name: string; source: string }) => ({
    id: counter.getCount(),
    payload,
  }),
);

export const getSuccess = createAction(
  GET_SUCCESS,
  (payload: { chromosome: Track }) => ({ payload }),
);

export const getFailure = createAction(
  GET_FAILURE,
  (payload: { name: string; source: string }) => ({ payload }),
);

const all = union({ clear, get, getSuccess, getFailure });
export type Actions = typeof all;
