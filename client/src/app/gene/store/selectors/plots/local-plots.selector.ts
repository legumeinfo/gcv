// NgRx
import { createSelector } from '@ngrx/store';
// store
import { getSelectedMicroTracksForCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector'; 
// app
import { Track, Plot } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


export const getLocalPlots = (track: (Track | ClusterMixin)) => createSelector(
  getSelectedMicroTracksForCluster((track as ClusterMixin).cluster),
  (tracks: (Track | ClusterMixin)[]): Plot[] => {
    const sequence = track as Track;
    const plots = tracks.map((t) => new Plot(t, sequence));
    return plots;
  }
);
