import { Action } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';

export const CLEAR = '[GENE] CLEAR';
export const GET = '[GENE] GET';
export const GET_SUCCESS = '[GENE] GET_SUCCESS';
export const GET_FAILURE = '[GENE] GET_FAILURE';


export class Clear implements Action {
  readonly type = CLEAR;
}

export class Get implements Action {
  readonly type = GET;
  readonly id = counter.getCount();
  constructor(public payload: {names: string[], source: string}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {genes: Gene[]}) { }
}

export class GetFailure implements Action {
  readonly type = GET_FAILURE;
  constructor(public payload: {names: string[], source: string}) { }
}

export type Actions = Clear | Get | GetSuccess | GetFailure;

// bins track genes by source and generates a get action for each source
export function tracksToGetGeneActions(tracks: Track[]): Get[] {
  const sourceGenes = {};
  tracks.forEach((t) => {
    if (!(t.source in sourceGenes)) {
      sourceGenes[t.source] = [];
    }
    t.genes.forEach((g) => {
      sourceGenes[t.source].push(g);
    });
  });
  const actions = [];
  Object.keys(sourceGenes).forEach((source) => {
    const genes = sourceGenes[source];
    if (genes.length !== 0) {
      const action = new Get({names: genes, source})
      actions.push(action);
    }
  });
  return actions;
}
