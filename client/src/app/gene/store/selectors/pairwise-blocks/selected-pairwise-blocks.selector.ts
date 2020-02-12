// NgRx
import { createSelector } from '@ngrx/store';
// store
import { getSelectedChromosomeIDs }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { TrackID } from '@gcv/gene/store/utils';
import { initialState, partialPairwiseBlocksID, PartialPairwiseBlocksID, State }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import { getPairwiseBlocksState } from './pairwise-blocks-state.selector';
// app
import { PairwiseBlocks } from '@gcv/gene/models';


export const getSelectedPartialBlockIDs = createSelector(
  getPairwiseBlocksState,
  getSelectedChromosomeIDs,
  fromParams.getSourcesParam,
  (state: State, ids: TrackID[], sources: string[]):
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
    const idStrings = ids.map((id) => partialPairwiseBlocksID(id));
    const partialBlockIDset = new Set(idStrings);
    const reducer = (accumulator, id) => {
        const [reference, referenceSource, chromosome, chromosomeSource] =
          id.split(':');
        const partialID =
          partialPairwiseBlocksID(reference, referenceSource, chromosomeSource);
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
