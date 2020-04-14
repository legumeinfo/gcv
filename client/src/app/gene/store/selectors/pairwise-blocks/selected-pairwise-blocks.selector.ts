// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { getSelectedChromosomeIDs }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { TrackID } from '@gcv/gene/store/utils';
import { initialState, pairwiseBlocksID, PairwiseBlocksID, State }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import { getPairwiseBlocksState } from './pairwise-blocks-state.selector';
// app
import { memoizeArray } from '@gcv/core/utils';
import { PairwiseBlocks } from '@gcv/gene/models';


export const getSelectedPartialBlockIDs = createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  getSelectedChromosomeIDs,
  fromParams.getSourcesParam,
  (state: State, ids: TrackID[], sources: string[]):
  PairwiseBlocksID[] => {
    const reducer = (accumulator, {name: reference, source: referenceSource}) =>
      {
        sources.forEach((source) => {
          const partialID =
            pairwiseBlocksID(reference, referenceSource, source);
          accumulator[partialID] = {reference, referenceSource, source};
        });
        return accumulator;
      };
    const idMap = ids.reduce(reducer, {});
    return Object.values(idMap);
  },
);

// derive selected pairwise blocks from Chromosome State
export const getSelectedPairwiseBlocks = createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  getSelectedPartialBlockIDs,
  (state: State, ids: PairwiseBlocksID[]):
  PairwiseBlocks[] => {
    const idStrings = ids.map((id) => pairwiseBlocksID(id));
    const partialBlockIDset = new Set(idStrings);
    const reducer = (accumulator, id) => {
        const [reference, referenceSource, chromosome, chromosomeSource] =
          id.split(':');
        const partialID =
          pairwiseBlocksID(reference, referenceSource, chromosomeSource);
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

export const getUnloadedSelectedPartialPairwiseBlocksIDs =
createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  getSelectedPartialBlockIDs,
  // TODO: can initialState be handled upstream?
  (state: State=initialState, ids: PairwiseBlocksID[]):
  PairwiseBlocksID[] => {
    const loadingIDs = new Set(state.loading.map(pairwiseBlocksID));
    const loadedIDs = new Set(state.loaded.map(pairwiseBlocksID));
    const unloadedIDs = ids.filter((id) => {
        const idString = pairwiseBlocksID(id);
        return loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);
