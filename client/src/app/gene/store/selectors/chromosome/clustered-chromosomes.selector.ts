// NgRx
import { createSelector } from '@ngrx/store';
// store
import { trackID } from '@gcv/gene/store/utils';
import { getSelectedMicroTracksForCluster } from
  '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector';
import { getSelectedChromosomes } from './selected-chromosomes.selector';
// app
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


export const getSelectedChromosomesForCluster =
(id: number) => createSelector(
  getSelectedChromosomes,
  getSelectedMicroTracksForCluster(id),
  (chromosomes: Track[], tracks: (Track | ClusterMixin)[]): Track[] => {
    const _tracks = tracks as Track[];
    const trackIDs = _tracks.map((t) => trackID(t.name, t.source));
    const trackIDset = new Set(trackIDs);
    const clusterChromosomes = chromosomes
      .filter((c) => {
        const id = trackID(c.name, c.source);
        return trackIDset.has(id);
      })
    return clusterChromosomes;
  },
);