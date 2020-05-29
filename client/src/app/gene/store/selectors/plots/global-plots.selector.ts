// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { getSelectedChromosomes }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import { getSelectedMicroTracksForCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector'; 
// app
import { memoizeArray } from '@gcv/core/utils';
import { Track, Plot } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


export const getGlobalPlots = (track: (Track & ClusterMixin)) =>
createSelectorFactory(memoizeArray)(
  getSelectedMicroTracksForCluster(track.cluster),
  getSelectedChromosomes,
  (tracks: (Track & ClusterMixin)[], chromsomes: Track[]): Plot[] => {
    const trackToID = (t) => `${t.name}:${t.source}`;
    const selectedIDs = new Set(tracks.map(trackToID));
    const clusterChromsomes = chromsomes.filter((c) => {
        const id = trackToID(c);
        return selectedIDs.has(id);
      });
    const cluster = track.cluster;
    const trackFamilies = new Set(track.families);
    trackFamilies.delete('');
    const references = clusterChromsomes.map((c) => {
        const families = [];
        const genes = [];
        c.families.forEach((f, i) => {
          if (trackFamilies.has(f)) {
            families.push(f);
            genes.push(c.genes[i]);
          }
        });
        return {
          cluster,
          families,
          genes,
          ...c
        };
      });
    const plots = references.map((r) => new Plot(r, track));
    return plots;
  }
);
