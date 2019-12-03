// NgRx
import { createSelector } from '@ngrx/store';
// store
import { getSelectedChromosomes }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import { getSelectedMicroTracksForCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector'; 
// app
import { Track, Plot } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


export const getGlobalPlots = (track: (Track | ClusterMixin)) => createSelector(
  getSelectedMicroTracksForCluster((track as ClusterMixin).cluster),
  getSelectedChromosomes,
  (tracks: (Track | ClusterMixin)[], chromsomes: Track[]): Plot[] => {
    const trackToID = (t) => `${t.name}:${t.source}`;
    const selectedIDs = new Set(tracks.map(trackToID));
    const clusterChromsomes = chromsomes.filter((c) => {
        const id = trackToID(c);
        return selectedIDs.has(id);
      });
    const cluster = (track as ClusterMixin).cluster;
    const sequence = track as Track;
    const trackFamilies = new Set(sequence.families);
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
    const plots = references.map((r) => new Plot(r, sequence));
    return plots;
  }
);
