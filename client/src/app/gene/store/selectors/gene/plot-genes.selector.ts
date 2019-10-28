// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { getSelectedMicroTracksForCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector';
import { getGeneState } from './gene-state.selector';
// app
import { Gene, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


const getTrackGenesFromState = (track: Track, state: State): Gene[] => {
  return track.genes
    .map((name: string): string => geneID(name, track.source))
    .filter((id: string) => id in state.entities)
    .map((id: string): Gene => state.entities[id]);
}


export const getLocalPlotGenes = (track: (Track | ClusterMixin)) =>
createSelector(
  getGeneState,
  getSelectedMicroTracksForCluster((track as ClusterMixin).cluster),
  (state: State, tracks: Track[]) => {
    const sequence = (track as Track);
    const sequenceGenes: Gene[] = getTrackGenesFromState(sequence, state);
    const tracksGenes = tracks.map((t) => getTrackGenesFromState(t, state));
    return [].concat.apply(sequenceGenes, tracksGenes);
  }
);
