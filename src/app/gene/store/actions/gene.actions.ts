import { createAction, union } from '@ngrx/store';
import { counter } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';

export const CLEAR = '[GENE] CLEAR';
export const GET = '[GENE] GET';
export const GET_SUCCESS = '[GENE] GET_SUCCESS';
export const GET_FAILURE = '[GENE] GET_FAILURE';

export const clear = createAction(CLEAR);

export const get = createAction(
  GET,
  (payload: { names: string[]; source: string }) => ({
    id: counter.getCount(),
    payload,
  }),
);

export const getSuccess = createAction(
  GET_SUCCESS,
  (payload: { genes: Gene[] }) => ({ payload }),
);

export const getFailure = createAction(
  GET_FAILURE,
  (payload: { names: string[]; source: string }) => ({ payload }),
);

const all = union({ clear, get, getSuccess, getFailure });
export type Actions = typeof all;

// bins track genes by source and generates a get action for each source
export function tracksToGetGeneActions(
  tracks: Track[],
): ReturnType<typeof get>[] {
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
      const action = get({ names: genes, source });
      actions.push(action);
    }
  });
  return actions;
}
