import { createAction, union } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { PairwiseBlocks, Track } from '@gcv/gene/models';
import { BlockParams } from '@gcv/gene/models/params';

export const CLEAR = '[PAIRWISE_BLOCKS] CLEAR';
export const GET = '[PAIRWISE_BLOCKS] GET';
export const GET_SUCCESS = '[PAIRWISE_BLOCKS] GET_SUCCESS';
export const GET_FAILURE = '[PAIRWISE_BLOCKS] GET_FAILURE';

export const clear = createAction(CLEAR);

export const get = createAction(
  GET,
  (payload: {
    chromosome: Track;
    source: string;
    params: BlockParams;
    targets: string[];
  }) => ({ id: counter.getCount(), payload }),
);

export const getSuccess = createAction(
  GET_SUCCESS,
  (payload: {
    chromosome: Track;
    source: string;
    targets: string[];
    blocks: PairwiseBlocks[];
  }) => ({ payload }),
);

export const getFailure = createAction(
  GET_FAILURE,
  (payload: { chromosome: Track; source: string; targets: string[] }) => ({
    payload,
  }),
);

const _all = union({ clear, get, getSuccess, getFailure });
export type Actions = typeof _all;
