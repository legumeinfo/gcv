// A PairwiseBlock is a syntenic block defined between two chromosomes. A
// PairwiseBlocks is a collection of these blocks for the two chromosomes. This
// file contains an NgRx reducer for storing and accessing PairwiseBlocks.
// Specifically, syntenic blocks are loaded as PairwiseBlocks on demand from a
// given source for a given reference chromosome and 0 or more target
// chromosomes. These PairwiseBlocks are stored by the pairwise-blocks reducer
// and made available via selectors. Note: If no (0) target chromosomes are
// given, then only one loading/loaded/failed ID is created for the
// corresponding requests and the "*" wildcard is used as the chromosome name.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// stpre
import * as pairwiseBlocksActions from '@gcv/gene/store/actions/pairwise-blocks.actions';
// app
import { PairwiseBlocks } from '@gcv/gene/models';
import { ActionID } from '@gcv/store/utils';


declare var Object: any;  // because TypeScript doesn't support Object.values


export const pairwiseBlocksFeatureKey = 'pairwiseblocks';


export type PairwiseBlocksID = {
  referenceSource: string,
  reference: string,
  chromosomeSource: string,
  chromosome?: string,
};


export function singleID(name: string, source: string): string {
  return `${name}:${source}`;
};


export function pairwiseBlocksID(referenceSource: string, reference: string,
chromosomeSource: string, chromosome?: string): string;
export function pairwiseBlocksID
({referenceSource, reference, chromosomeSource, ...attrs}): string;
export function pairwiseBlocksID(...args): string {
  if (typeof args[0] === 'object') {
    const {referenceSource, reference, chromosomeSource, ...attrs} =
      args[0];
    if (attrs.hasOwnProperty('chromosome')) {
      return pairwiseBlocksID(
        referenceSource,
        reference,
        chromosomeSource,
        attrs.chromosome,
      );
    }
    return pairwiseBlocksID(referenceSource, reference, chromosomeSource);
  }
  const [referenceSource, reference, chromosomeSource, ...attrs] = args;
  const chromosome = (attrs.length > 0) ? attrs[0] : '*';
  const referenceID = singleID(reference, referenceSource);
  const chromosomeID = singleID(chromosome, chromosomeSource);
  return `${referenceID}:${chromosomeID}`;
}


const adapter = createEntityAdapter<PairwiseBlocks>({
  selectId: (e) => pairwiseBlocksID(e),
});


export interface State extends EntityState<PairwiseBlocks> {
  failed: PairwiseBlocksID[];
  loaded: PairwiseBlocksID[];
  loading: (PairwiseBlocksID & ActionID)[];
}

export const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],  // need loaded to track which blocks were loaded with wildcards
  loading: [],
});


export function pairwiseBlocksActionID({action, ...pairwiseID}: PairwiseBlocksID & ActionID): string {
  return `${pairwiseBlocksID(pairwiseID)}:${action}`;
}


// subtracts overlapping IDs from a1
export function idArrayLeftDifference(a1, a2, checkAction=false) {
  const id2string = (checkAction) ? pairwiseBlocksActionID : pairwiseBlocksID;
  const a2IDs = new Set(a2.map(id2string));
  return a1.filter((id) => {
    const {chromosome, ...wildcardID} = id;
    return !a2IDs.has(id2string(wildcardID)) &&
           !a2IDs.has(id2string(id));
  });
}


export function idArrayIntersection(a1, a2, checkAction=false) {
  const id2string = (checkAction) ? pairwiseBlocksActionID : pairwiseBlocksID;
  const a2IDs = new Set(a2.map(id2string));
  return a1.filter((id) => a2IDs.has(id2string(id)));
}


export function reducer(
  state = initialState,
  action: pairwiseBlocksActions.Actions
): State {
  switch (action.type) {
    case pairwiseBlocksActions.CLEAR:
      // TODO: can we just return the initial state?
      return adapter.removeAll({
        ...state,
        failed: [],
        loaded: [],
        loading: [],
      });
    case pairwiseBlocksActions.GET:
      const {chromosome, source, targets} = action.payload;
      const partialID = {
          referenceSource: chromosome.source,
          reference: chromosome.name,
          chromosomeSource: source,
          action: action.id,
        };
      let targetIDs = (targets.length > 0) ?
        targets.map((name) => ({...partialID, chromosome: name})) :
        [partialID];  // will be given wildcard name
      // filter targets (including *) by loading and loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loading);
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      // add an ID for each target or *
      const loading = state.loading.concat(targetIDs);
      // remove IDs from failed
      const failed = idArrayLeftDifference(state.failed, targetIDs);
      return {
        ...state,
        loading,
        failed,
      };
    case pairwiseBlocksActions.GET_SUCCESS:
    {
      const {chromosome, source, targets, blocks} = action.payload;
      const partialID = {
          referenceSource: chromosome.source,
          reference: chromosome.name,
          chromosomeSource: source,
        };
      let targetIDs = (targets.length > 0) ?
        targets.map((name) => ({...partialID, chromosome: name})) :
        [partialID];  // will be given wildcard name
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      const loaded = state.loaded.concat(targetIDs);
      // add an ID for each target or *
      return adapter.addMany(
        blocks,
        {
          ...state,
          loading,
          loaded,
        },
      );
    }
    case pairwiseBlocksActions.GET_FAILURE:
    {
      const {chromosome, source, targets} = action.payload;
      const partialID = {
          referenceSource: chromosome.source,
          reference: chromosome.name,
          chromosomeSource: source,
        };
      let targetIDs = (targets.length > 0) ?
        targets.map((name) => ({...partialID, chromosome: name})) :
        [partialID];  // will be given wildcard name
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to failed
      targetIDs = idArrayLeftDifference(targetIDs, state.failed);
      const failed = state.failed.concat(targetIDs);
      return {
        ...state,
        loading,
        failed,
      };
    }
    default:
      return state;
  }
}
