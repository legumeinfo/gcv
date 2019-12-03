// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { getGeneState } from './gene-state.selector';
// app
import { Gene, Track } from '@gcv/gene/models';


const getTrackGenesFromState = (track: Track, state: State): Gene[] => {
  return track.genes
    .map((name: string): string => geneID(name, track.source))
    .filter((id: string) => id in state.entities)
    .map((id: string): Gene => state.entities[id]);
}


export const getGenes = (tracks: Track[]) => createSelector(
  getGeneState,
  (state: State) => {
    const trackGenes = tracks.map((t) => getTrackGenesFromState(t, state));
    return [].concat.apply([], trackGenes);
  }
);
