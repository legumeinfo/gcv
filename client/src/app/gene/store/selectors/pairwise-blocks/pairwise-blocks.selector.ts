// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { State, singleID }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { getPairwiseBlocksState } from './pairwise-blocks-state.selector';
// app
import { arrayFlatten, memoizeArray } from '@gcv/core/utils';
import { Gene, PairwiseBlocks, Track } from '@gcv/gene/models';
import { MACRO_ORDER_ALGORITHMS } from '@gcv/gene/algorithms';
import { macroRegexpFactory } from '@gcv/gene/algorithms/utils';


const getTrackPairwiseBlocksFromState = (tracks: Track[], state: State):
PairwiseBlocks[][] => {
  const reducer = (accumulator, id) => {
      const [referenceName, referenceSource, chromosomeName, chromosomeSource] =
        id.split(':');
      const referenceID = singleID(referenceName, referenceSource);
      const chromosomeID = singleID(chromosomeName, chromosomeSource);
      if (!(referenceID in accumulator)) {
        accumulator[referenceID] = [];
      }
      accumulator[referenceID].push(chromosomeID);
      return accumulator;
    };
  const ids = state.ids as string[];
  const idMap = ids.reduce(reducer, {});
  return tracks
    .map((t): string => singleID(t.name, t.source))
    .filter((referenceID: string) => referenceID in idMap)
    .map((referenceID: string): PairwiseBlocks[] => {
      return idMap[referenceID].map((chromosomeID) => {
        const id = `${referenceID}:${chromosomeID}`;
        return state.entities[id];
      });
    });
}

const orderAlgorithmMap = MACRO_ORDER_ALGORITHMS.reduce((map, a) => {
    map[a.id] = a;
    return map;
  }, {});

export const getPairwiseBlocks =
(tracks: Track[], sources: string[]) => createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  fromParams.getMacroFilterParams,
  fromParams.getMacroOrderParams,
  (state: State, {bregexp}, {border}) => {
    const blocksFilter = macroRegexpFactory(bregexp).algorithm;
    const orderAlg = (border in orderAlgorithmMap) ?
      orderAlgorithmMap[border].algorithm : (t1, t2) => 0;
    const trackBlocks = getTrackPairwiseBlocksFromState(tracks, state);
    const flattenedBlocks = arrayFlatten(trackBlocks);
    return blocksFilter(flattenedBlocks).sort(orderAlg);
  }
);
