import { Action } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';
import { QueryParams } from '@gcv/gene/models/params';
import { ClusterMixin } from '@gcv/gene/models/mixins';

export const CLEAR = '[MICRO_TRACKS] CLEAR';
export const SEARCH = '[MICRO_TRACKS] SEARCH';
export const SEARCH_SUCCESS = '[MICRO_TRACKS] SEARCH_SUCCESS';
export const SEARCH_FAILURE = '[MICRO_TRACKS] SEARCH_FAILURE';

export class Clear implements Action {
  readonly type = CLEAR;
}

export class Search implements Action {
  readonly type = SEARCH;
  readonly id = counter.getCount();
  constructor(public payload: {cluster: number, families: string[],
    source: string, params: QueryParams}) { }
}

export class SearchSuccess implements Action {
  readonly type = SEARCH_SUCCESS;
  constructor(public payload: {cluster: number, tracks: (Track & ClusterMixin)[],
    source: string}) { }
}

export class SearchFailure implements Action {
  readonly type = SEARCH_FAILURE;
  constructor(public payload: {cluster: number, families: string[],
    source: string}) { }
}

export type Actions = Clear | Search | SearchSuccess | SearchFailure;
