// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { State, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { getGeneState } from './gene-state.selector';
// app
import { arrayFlatten, memoizeArray } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';


const getTrackGenesFromState = (track: Track, state: State): Gene[] => {
  return track.genes
    .map((name: string): string => geneID(name, track.source))
    .filter((id: string) => id in state.entities)
    .map((id: string): Gene => state.entities[id]);
}


export const getGenes =
(tracks: Track[]) => createSelectorFactory(memoizeArray)(
  getGeneState,
  (state: State): Gene[] => {
    const trackGenes = tracks.map((t) => getTrackGenesFromState(t, state));
    return arrayFlatten(trackGenes);
  }
);
