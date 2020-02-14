// A PairwiseBlock is a syntenic block defined between two chromosomes. A
// PairwiseBlocks is a collection of these blocks. This file contains an NgRx
// reducer and selectors for storing and accessing PairwiseBlocks. Specifically,
// syntenic blocks are loaded as PairwiseBlocks for each chromosome loaded for
// the genes provided by the user (see ./chromosome.reducer.ts). These
// PairwiseBlocks are stored by the pairwise-blocks reducer and made available
// via selectors.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// stpre
import * as pairwiseBlocksActions from '@gcv/gene/store/actions/pairwise-blocks.actions';
// app
import { PairwiseBlocks } from '@gcv/gene/models';
import { ActionID } from '@gcv/gene/store/utils';

declare var Object: any;  // because TypeScript doesn't support Object.values

export const pairwiseBlocksFeatureKey = 'pairwiseblocks';

export type PairwiseBlocksID = {
  referenceName: string,
  referenceSource: string,
  chromosomeName: string,
  chromosomeSource: string,
};

export type PartialPairwiseBlocksID = {
  referenceName: string,
  referenceSource: string,
  source: string,
};

export function singleID(name: string, source: string): string {
  return `${name}:${source}`;
};

const pairwiseBlocksID = (reference: string, referenceSource: string,
chromosome: string, chromosomeSource: string) => {
  const referenceID = singleID(reference, referenceSource);
  const chromosomeID = singleID(chromosome, chromosomeSource);
  return `${referenceID}:${chromosomeID}`;
};

export function partialPairwiseBlocksID(reference: string,
  referenceSource: string, source: string): string;
export function partialPairwiseBlocksID({referenceName, referenceSource, source}): string;
export function partialPairwiseBlocksID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return partialPairwiseBlocksID(id.reference.name, id.reference.source, id.source);
  }
  const [referenceName, referenceSource, source] = args;
  const referenceID = singleID(referenceName, referenceSource);
  return `${referenceID}:${source}`;
};

const adapter = createEntityAdapter<PairwiseBlocks>({
  selectId: (e) => pairwiseBlocksID(e.reference, e.referenceSource,
    e.chromosome, e.chromosomeSource)
});

// TODO: is loaded even necessary or can it be derived from entity ids and
// selectChromosomeIDs selector?
export interface State extends EntityState<PairwiseBlocks> {
  failed: PartialPairwiseBlocksID[];
  loaded: PartialPairwiseBlocksID[];
  loading: (PartialPairwiseBlocksID & ActionID)[];
}

export const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

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
      const chromosome = action.payload.chromosome;
      const source = action.payload.source;
      const partialID = {
          referenceName: chromosome.name,
          referenceSource: chromosome.source,
          source,
          action: action.id,
        };
      return {
        ...state,
        loading: state.loading.concat([partialID]),
      };
    case pairwiseBlocksActions.GET_SUCCESS:
    {
      const chromosome = action.payload.chromosome;
      const source = action.payload.source;
      const blocks = action.payload.blocks;
      const partialID = {
          referenceName: chromosome.name,
          referenceSource: chromosome.source,
          source,
        };
      return adapter.addMany(
        blocks,
        {
          ...state,
          loaded: state.loaded.concat(partialID),
          loading: state.loading.filter(
          ({referenceName, referenceSource, source}) => {
            return !(referenceName === partialID.referenceName &&
                     referenceSource === partialID.referenceSource &&
                     source === partialID.source);
          }),
        },
      );
    }
    case pairwiseBlocksActions.GET_FAILURE:
    {
      const chromosome = action.payload.chromosome;
      const source = action.payload.source;
      const partialID = {
          referenceName: chromosome.name,
          referenceSource: chromosome.source,
          source,
        };
      return {
        ...state,
        failed: state.failed.concat(partialID),
        loading: state.loading.filter(
        ({referenceName, referenceSource, source}) => {
          return !(referenceName === partialID.referenceName &&
                   referenceSource === partialID.referenceSource &&
                   source === partialID.source);
        }),
      };
    }
    default:
      return state;
  }
}
