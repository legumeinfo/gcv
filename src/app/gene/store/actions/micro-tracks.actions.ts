import { createAction, union } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';
import { QueryParams } from '@gcv/gene/models/params';
import { ClusterMixin } from '@gcv/gene/models/mixins';

export const CLEAR = '[MICRO_TRACKS] CLEAR';
export const SEARCH = '[MICRO_TRACKS] SEARCH';
export const SEARCH_SUCCESS = '[MICRO_TRACKS] SEARCH_SUCCESS';
export const SEARCH_FAILURE = '[MICRO_TRACKS] SEARCH_FAILURE';

export const clear = createAction(CLEAR);

export const search = createAction(
  SEARCH,
  (payload: {
    cluster: number;
    families: string[];
    source: string;
    params: QueryParams;
  }) => ({ id: counter.getCount(), payload }),
);

export const searchSuccess = createAction(
  SEARCH_SUCCESS,
  (payload: {
    cluster: number;
    tracks: (Track & ClusterMixin)[];
    source: string;
  }) => ({ payload }),
);

export const searchFailure = createAction(
  SEARCH_FAILURE,
  (payload: { cluster: number; families: string[]; source: string }) => ({
    payload,
  }),
);

const all = union({ clear, search, searchSuccess, searchFailure });
export type Actions = typeof all;
