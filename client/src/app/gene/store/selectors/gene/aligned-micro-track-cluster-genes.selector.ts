// NgRx
import { createSelector } from '@ngrx/store';
// store
import { geneID, State } from '@gcv/gene/store/reducers/gene.reducer';
import { getAlignedMicroTrackCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector';
import { getGeneState } from './gene-state.selector';
// app
import { Gene, Track } from '@gcv/gene/models';


export const getAlignedMicroTrackClusterGenes = (id: number) => createSelector(
  getGeneState,
  getAlignedMicroTrackCluster(id),
  (state: State, tracks: Track[]) => {
    const genes: Gene[] = [];
    tracks.forEach((track) => {
      track.genes.forEach((name) => {
        const id = geneID(name, track.source);
        if (id in state.entities) {
          const gene = state.entities[id];
          genes.push(gene);
        }
      });
    });
    return genes;
  }
);
