// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { getSelectedMicroTracksForCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector'; 
// app
import { memoizeArray } from '@gcv/core/utils';
import { Track, Plot } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


export const getLocalPlots = (track: (Track | ClusterMixin)) =>
createSelectorFactory(memoizeArray)(
  getSelectedMicroTracksForCluster((track as ClusterMixin).cluster),
  (tracks: (Track & ClusterMixin)[]): Plot[] => {
    const sequence = track as Track;
    const plots = tracks.map((t) => new Plot(t, sequence));
    return plots;
  }
);
