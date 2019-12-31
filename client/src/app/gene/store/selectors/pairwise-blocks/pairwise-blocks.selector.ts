// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State, singleID }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import { getPairwiseBlocksState } from './pairwise-blocks-state.selector';
// app
import { arrayFlatten } from '@gcv/core/utils';
import { Gene, PairwiseBlocks, Track } from '@gcv/gene/models';


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


export const getPairwiseBlocks =
(tracks: Track[], sources: string[]) => createSelector(
  getPairwiseBlocksState,
  (state: State) => {
    const trackBlocks = getTrackPairwiseBlocksFromState(tracks, state);
    return arrayFlatten(trackBlocks);
  }
);
