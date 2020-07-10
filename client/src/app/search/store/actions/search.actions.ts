import { Action, createAction, props } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Result } from '@gcv/search/models';

export const CLEAR = '[SEARCH] CLEAR';
export const SEARCH = '[SEARCH] SEARCH';
export const SEARCH_SUCCESS = '[SEARCH] SEARCH_SUCCESS';
export const SEARCH_FAILURE = '[SEARCH] SEARCH_FAILURE';

export class Clear implements Action {
  readonly type = CLEAR;
}

export class Search implements Action {
  readonly type = SEARCH;
  readonly id = counter.getCount();
  constructor(public payload: {query: string, source: string}) { }
}

export class SearchSuccess implements Action {
  readonly type = SEARCH_SUCCESS;
  constructor(public payload: {result: Result, source: string}) { }
}

export class SearchFailure implements Action {
  readonly type = SEARCH_FAILURE;
  constructor(public payload: {source: string}) { }
}

export type Actions = Clear | Search | SearchSuccess | SearchFailure;
