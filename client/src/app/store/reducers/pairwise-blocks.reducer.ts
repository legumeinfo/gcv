import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as fromChromosome from "./chromosome.reducer";
import * as fromRouter from "./router.store";
import * as pairwiseBlocksActions from "../actions/pairwise-blocks.actions";
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

const partialPairwiseBlocksID = (reference: string, referenceSource: string,
source: string) => {
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

// TODO: replace with entity selector
// https://ngrx.io/guide/entity/adapter#entity-selectors
export const getAll = createSelector(
  getPairwiseBlocksState,
  (state: State): PairwiseBlocks[] => Object.values(state.entities),
);

export const getSelectedPartialBlockIDs = createSelector(
  getPairwiseBlocksState,
  fromChromosome.getSelectedChromosomeIDs,
  fromRouter.getMicroQueryParamSources,
  (state: State, ids: fromChromosome.ChromosomeID[], sources: string[]):
  PartialPairwiseBlocksID[] => {
    const flatten = (arr) => [].concat(...arr);
    const partialIDstrings = flatten(ids.map(({name, source}) => {
        const id = `${name}:${source}:`;
        return sources.map((s) => id+s);
      }));
    const partialBlockIDset = new Set(...partialIDstrings);
    const partialIDs = Array.from(partialBlockIDset).map((id) => {
        const [reference, referenceSource, source] = id.split(":");
        return {reference, referenceSource, source};
      });
    return partialIDs;
  },
);

// derive selected pairwise blocks from Chromosome State
export const getSelectedChromosomes = createSelector(
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
        const partialID = `${reference}:${referenceSource}:${chromosomeSource}`;
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

export const getLoading = createSelector(
  getPairwiseBlocksState,
  (state: State): PartialPairwiseBlocksID[] => state.loading,
);

export const getLoaded = createSelector(
  getPairwiseBlocksState,
  getSelectedPartialBlockIDs,
  (state: State, ids: PartialPairwiseBlocksID[]): PartialPairwiseBlocksID[] => {
    const partialIDs = [...state.ids].map((id: string) => {
      const [reference, referenceSource, chromosome, chromosomeSource] =
        id.split(":");
      return partialPairwiseBlocksID(reference, referenceSource,
        chromosomeSource); 
      });
    const entityIDs = new Set(partialIDs);
    const loaded = ids.filter(({reference, referenceSource, source}) => {
        const idString = partialPairwiseBlocksID(reference, referenceSource,
          source);
        return entityIDs.has(idString);
      });
    return Array.from(loaded);
  },
);

export const getFailed = createSelector(
  getPairwiseBlocksState,
  (state: State): PartialPairwiseBlocksID[] => state.failed,
);

/*
export const hasPairwiseBlocksFromSource = (reference: string,
referenceSource: string, source: string) => createSelector(
  getPairwiseBlocksState,
  (state: State): boolean => {
    const id = partialPairwiseBlocksID(reference, referenceSource, source);
    const ids = [...state.ids].map((id: string) => {
        const [reference, referenceSource, chromosome, chromosomeSource] =
          id.split(":");
        const partialID = `${reference}:${referenceSource}:${chromosomeSource}`;
        return partialID;
      });
    return ids.indexOf(id) > -1;
  }
);
*/

export const hasPairwiseBlocks = (reference: string, referenceSource: string,
chromosome: string, chromosomeSource) => createSelector(
  getPairwiseBlocksState,
  (state: State): boolean => {
    const id = pairwiseBlocksID(reference, referenceSource, chromosome,
      chromosomeSource);
   return id in state.entities;
  },
);
