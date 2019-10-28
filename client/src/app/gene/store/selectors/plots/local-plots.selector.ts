// NgRx
import { createSelector } from '@ngrx/store';
// store
import { getSelectedMicroTracksForCluster }
  from '@gcv/gene/store/selectors/micro-tracks/clustered-and-aligned-micro-tracks.selector'; 
// app
import { Track, Pair, Plot } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


export const getLocalPlots = (track: (Track | ClusterMixin)) => createSelector(
  getSelectedMicroTracksForCluster((track as ClusterMixin).cluster),
  (tracks: (Track | ClusterMixin)[]): Plot[] => {
    const familyIndexMap = {};
    const sequence = track as Track;
    sequence.families.forEach((f, i) => {
      if (!(f in familyIndexMap)) {
        familyIndexMap[f] = [];
      }
      familyIndexMap[f].push(i);
    });
    const reducer = (accumulator, f, i) => {
        if (f in familyIndexMap) {
          familyIndexMap[f].forEach((j) => {
            const pair = new Pair(i, j);
            accumulator.push(pair);
          });
        }
        return accumulator;
      };
    const plots = tracks.map((t) => {
        const plot = new Plot(t, sequence);
        (t as Track).families.reduce(reducer, plot.pairs);
        return plot;
      });
    return plots;
  }
);
