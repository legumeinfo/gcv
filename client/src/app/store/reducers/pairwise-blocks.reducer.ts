// A PairwiseBlock is a syntenic block defined between two chromosomes. A
// PairwiseBlocks is a collection of these blocks. This file contains an NgRx
// reducer and selectors for storing and accessing PairwiseBlocks. Specifically,
// syntenic blocks are loaded as PairwiseBlocks for each chromosome loaded for
// the genes provided by the user (see ./chromosome.reducer.ts). These
// PairwiseBlocks are stored by the pairwise-blocks reducer and made available
// via selectors.

// NgRx
import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
// stpre
import * as fromChromosome from "./chromosome.reducer";
import * as fromRouter from "./router.reducer";
import * as pairwiseBlocksActions from "../actions/pairwise-blocks.actions";
// app
import { PairwiseBlocks } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

export type PairwiseBlocksID = {
  reference: string,
  referenceSource: string,
  chromosome: string,
  chromosomeSource: string
};

export type PartialPairwiseBlocksID = {
  reference: string,
  referenceSource: string,
  source: string
};

const pairwiseBlocksID = (reference: string, referenceSource: string,
chromosome: string, chromosomeSource: string) => {
  return `${reference}:${referenceSource}:${chromosome}:${chromosomeSource}`;
};

function partialPairwiseBlocksID(reference: string, referenceSource: string,
source: string): string;
function partialPairwiseBlocksID({reference, referenceSource, source}): string;
function partialPairwiseBlocksID(...args): string {
  if (typeof args[0] === "object") {
    const id = args[0];
    return partialPairwiseBlocksID(id.reference, id.referenceSource, id.source);
  }
  const [reference, referenceSource, source] = args;
  return `${reference}:${referenceSource}:${source}`;
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
  loading: PartialPairwiseBlocksID[];
}

const initialState: State = adapter.getInitialState({
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
          reference: chromosome.name,
          referenceSource: chromosome.source,
          source,
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
          reference: chromosome.name,
          referenceSource: chromosome.source,
          source,
        };
      return adapter.addMany(
        blocks,
        {
          ...state,
          loaded: state.loaded.concat(partialID),
          loading: state.loading.filter(
          ({reference, referenceSource, source}) => {
            return !(reference === partialID.reference &&
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
          reference: chromosome.name,
          referenceSource: chromosome.source,
          source,
        };
      return {
        ...state,
        failed: state.failed.concat(partialID),
        loading: state.loading.filter(
        ({reference, referenceSource, source}) => {
          return !(reference === partialID.reference &&
                   referenceSource === partialID.referenceSource &&
                   source === partialID.source);
        }),
      };
    }
    default:
      return state;
  }
}

export const getPairwiseBlocksState = createFeatureSelector<State>("pairwise-blocks");

export const getSelectedPartialBlockIDs = createSelector(
  getPairwiseBlocksState,
  fromChromosome.getSelectedChromosomeIDs,
  fromRouter.getMicroQueryParamSources,
  (state: State, ids: fromChromosome.ChromosomeID[], sources: string[]):
  PartialPairwiseBlocksID[] => {
    const reducer = (accumulator, {name: reference, source: referenceSource}) =>
      {
        sources.forEach((source) => {
          const partialID =
            partialPairwiseBlocksID(reference, referenceSource, source);
          accumulator[partialID] = {reference, referenceSource, source};
        });
        return accumulator;
      };
    const idMap = ids.reduce(reducer, {});
    return Object.values(idMap);
  },
);

// derive selected pairwise blocks from Chromosome State
export const getSelectedPairwiseBlocks = createSelector(
  getPairwiseBlocksState,
  getSelectedPartialBlockIDs,
  (state: State, ids: PartialPairwiseBlocksID[]):
  PairwiseBlocks[] => {
    const idStrings = ids.map(({reference, referenceSource, source}) => {
        return `${reference}:${referenceSource}:${source}`;
      });
    const partialBlockIDset = new Set(idStrings);
    const reducer = (accumulator, id) => {
        const [reference, referenceSource, chromosome, chromosomeSource] =
          id.split(":");
        const partialID = partialPairwiseBlocksID(reference, referenceSource,
          chromosomeSource);
        if (partialBlockIDset.has(partialID)) {
          const blocks = state.entities[id];
          accumulator.push(blocks);
        }
        return accumulator;
      };
    const selectedBlocks = [...state.ids].reduce(reducer, []);
    return selectedBlocks;
  },
);

export const getUnloadedSelectedPartialPairwiseBlocksIDs = createSelector(
  getPairwiseBlocksState,
  getSelectedPartialBlockIDs,
  // TODO: can initialState be handled upstream?
  (state: State=initialState, ids: PartialPairwiseBlocksID[]): PartialPairwiseBlocksID[] => {
    const loadingIDs = new Set(state.loading.map(partialPairwiseBlocksID));
    const loadedIDs = new Set(state.loaded.map(partialPairwiseBlocksID));
    const unloadedIDs = ids.filter((id) => {
        const idString = partialPairwiseBlocksID(id);
        return loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);
