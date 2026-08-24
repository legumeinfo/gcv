import { createAction, union } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Result } from '@gcv/search/models';

export const CLEAR = '[SEARCH] CLEAR';
export const SEARCH = '[SEARCH] SEARCH';
export const SEARCH_SUCCESS = '[SEARCH] SEARCH_SUCCESS';
export const SEARCH_FAILURE = '[SEARCH] SEARCH_FAILURE';

export const clear = createAction(CLEAR);

export const search = createAction(
  SEARCH,
  (payload: { query: string; source: string }) => ({
    id: counter.getCount(),
    payload,
  }),
);

export const searchSuccess = createAction(
  SEARCH_SUCCESS,
  (payload: { result: Result; source: string }) => ({ payload }),
);

export const searchFailure = createAction(
  SEARCH_FAILURE,
  (payload: { source: string }) => ({ payload }),
);

const all = union({ clear, search, searchSuccess, searchFailure });
export type Actions = typeof all;
