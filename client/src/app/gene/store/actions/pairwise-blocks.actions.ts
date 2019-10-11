import { Action } from '@ngrx/store';
import { BlockParams, PairwiseBlocks, Track } from '@gcv/gene/models';

export const CLEAR = '[PAIRWISE_BLOCKS] CLEAR';
export const GET = '[PAIRWISE_BLOCKS] GET';
export const GET_SUCCESS = '[PAIRWISE_BLOCKS] GET_SUCCESS';
export const GET_FAILURE = '[PAIRWISE_BLOCKS] GET_FAILURE';

export class Clear implements Action {
  readonly type = CLEAR;
}

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {chromosome: Track, source: string,
    params: BlockParams}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload:
    {chromosome: Track, source: string, blocks: PairwiseBlocks[]}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {chromosome: Track, source: string}) { }
}

export type Actions = Clear | Get | GetSuccess | GetFailure;
