// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { State, pairwiseBlocksID, singleID }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { getPairwiseBlocksState } from './pairwise-blocks-state.selector';
// app
import { arrayFlatten, memoizeArray } from '@gcv/core/utils';
import { Gene, PairwiseBlocks, Track } from '@gcv/gene/models';
import { MACRO_ORDER_ALGORITHMS } from '@gcv/gene/algorithms';
import { macroRegexpFactory } from '@gcv/gene/algorithms/utils';


export const getPairwiseBlocks = createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  (state: State): PairwiseBlocks[] => {
    return Object.values(state.entities) as PairwiseBlocks[];
  },
);


// TODO: update to accept any "track" that has the name and source attributes
export const getPairwiseBlocksForTracks =
(tracks: Track[], sources: string[]) => createSelectorFactory(memoizeArray)(
  getPairwiseBlocks,
  (blocks: PairwiseBlocks[]): PairwiseBlocks[] => {
    const chromosomeIDs = new Set(arrayFlatten(
        tracks.map((t) => {
          return sources.map((s) => {
            return pairwiseBlocksID(t.source, t.name, s);
          });
        })
      ));
    const filteredBlocks = blocks
      .filter((b) => {
        const {chromosome, ...wildcard} = b;
        const partialID = pairwiseBlocksID(wildcard);
        return chromosomeIDs.has(partialID);
      });
    return filteredBlocks;
  }
);


const orderAlgorithmMap = MACRO_ORDER_ALGORITHMS.reduce((map, a) => {
    map[a.id] = a;
    return map;
  }, {});


export const getFilteredAndOrderedPairwiseBlocksForTracks =
(tracks: Track[], sources: string[]) => createSelectorFactory(memoizeArray)(
  getPairwiseBlocksForTracks(tracks, sources),
  fromParams.getMacroFilterParams,
  fromParams.getMacroOrderParams,
  (blocks, {bregexp}, {border}) => {
    const blocksFilter = macroRegexpFactory(bregexp).algorithm;
    const orderAlg = (border in orderAlgorithmMap) ?
      orderAlgorithmMap[border].algorithm : (t1, t2) => 0;
    return blocksFilter(blocks).sort(orderAlg);
  },
);
