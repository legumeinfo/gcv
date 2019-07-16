// NgRx
import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
// store
import * as fromChromosome from "./chromosome.reducer";
import * as fromGene from "./gene.reducer";
import * as fromRouter from "./router.store";
import * as microTrackActions from "../actions/micro-tracks.actions";
// app
import * as clusterfck from "../../../assets/js/clusterfck";
import { GCV } from "../../../assets/js/gcv";
import { ClusteringParams, Gene, Track } from "../../models";
import { ClusterMixin } from "../../models/mixins";

declare var Object: any;  // because TypeScript doesn't support Object.values

// TODO: include graph from clustering
export type MicroTrackID = {startGene: string, stopGene: string, source: string};

const microTrackID = (startGene: string, stopGene: string, source: string) => {
  return `${startGene}:${stopGene}:${source}`;
};

const adapter = createEntityAdapter<Track>({
  selectId: (e) => {
    const startGene = e.genes[0];
    const stopGene = e.genes[e.genes.length-1];
    return microTrackID(startGene, stopGene, e.source);
  }
});

// TODO: is loaded even necessary or can it be derived from entity ids?
export interface State extends EntityState<Track> {
  failed: string[];  // TODO: include group from clustering
  loaded: string[];  // ditto
  loading: string[];  // ditto
}

export const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: microTrackActions.Actions,
): State {
  switch (action.type) {
    case microTrackActions.CLEAR:
      // TODO: can we just return the initial state?
      return adapter.removeAll({
        ...state,
        failed: [],
        loaded: [],
        loading: [],
      });
    case microTrackActions.SEARCH:
      const source = action.payload.source;
      return {
        ...state,
        loading: state.loading.concat([source]),
      };
    case microTrackActions.SEARCH_SUCCESS:
    {
      const tracks = action.payload.tracks;
      const source = action.payload.source;
      return adapter.addMany(
        tracks,
        {
          ...state,
          loaded: state.loaded.concat(source),
          loading: state.loading.filter((s) => s !== source),
        },
      );
    }
    case microTrackActions.SEARCH_FAILURE:
    {
      const source = action.payload.source;
      return {
        ...state,
        failed: state.failed.concat(source),
        loading: state.loading.filter((s) => s !== source),
      };
    }
    default:
      return state;
  }
}

export const getMicroTracksState = createFeatureSelector<State>("micro-tracks");

export const getMicroTracks = createSelector(
  getMicroTracksState,
  (state) => Object.values(state.entities),
);

// derive selected tracks from Chromosome and Gene States
export const getSelectedMicroTracks = createSelector(
  fromChromosome.getSelectedChromosomes,
  fromGene.getSelectedGenes,
  fromRouter.getMicroQueryParamNeighbors,
  (chromosomes: Track[], genes: Gene[], neighbors: number):
  Track[] => {
    const chromosomeMap = {};
    chromosomes.forEach((c) => {
      const id = `${c.name}:${c.source}`;
      chromosomeMap[id] = c;
    });
    const reducer = (accumulator, gene) => {
        const id = `${gene.chromosome}:${gene.source}`;
        if (id in chromosomeMap) {
          const chromosome = chromosomeMap[id];
          const i = chromosome.genes.indexOf(gene.name);
          if (i > -1) {
            const begin = Math.max(0, i-neighbors);
            const end = Math.min(chromosome.genes.length, i+neighbors+1);
            const track = {
                ...chromosome,
                genes: chromosome.genes.slice(begin, end),
                families: chromosome.families.slice(begin, end),
              };
            accumulator.push(track);
          }
        }
        return accumulator;
      };
    const tracks = genes.reduce(reducer, []);
    return tracks;
  }
);

export const selectedLoaded = fromChromosome.selectedLoaded;

// clusters micro tracks based on their families
// TODO: update params to work with new clusterer
// TODO: only cluster when selectedLoaded emits true
export const getClusteredSelectedMicroTracks = createSelector(
  getSelectedMicroTracks,
  (tracks: Track[]): (Track | ClusterMixin)[] => {
    const metric = (a: Track, b: Track): number => {
        const f1 = a.families;
        const f2 = b.families;
        const f3 = [...f2].reverse();
        const d1 = GCV.metrics.levenshtein(f1, f2);
        const d2 = GCV.metrics.levenshtein(f1, f3);
        return Math.min(d1, d2);
      };
    const clusters = clusterfck.hcluster(tracks, metric,
      clusterfck.AVERAGE_LINKAGE, 10);
    const recurrence = (cluster) => {
        const elements = [];
        if ("left" in cluster || "right" in cluster) {
          if ("left" in cluster) {
            elements.push(...recurrence(cluster["left"]));
          }
          if ("right" in cluster) {
            elements.push(...recurrence(cluster["right"]));
          }
        } else {
          elements.push(cluster["value"]);
        }
        return elements;
      };
    const mixin = (i) => {
        return (t) => {
          const t2 = Object.create(t);
          t2.cluster = i;
          return t2;
        };
      };
    const reducer = (accumulator, cluster, i) => {
        const clusterTracks = recurrence(cluster).map(mixin(i));
        accumulator.push(...clusterTracks);
        return accumulator;
      };
    const clusteredTracks = clusters.reduce(reducer, []);
    return clusteredTracks;
  }
);

// performs a multiple sequence alignment of the tracks in each cluster and
// outputs the aligned tracks and their consensus sequence
export const getClusteredAndAlignedSelectedMicroTracks = createSelector(
  getClusteredSelectedMicroTracks,
  (tracks: (Track | ClusterMixin)[]) => {
    // group tracks by cluster
    const clusterer = (accumulator, track) => {
        if (!(track.cluster in accumulator)) {
          accumulator[track.cluster] = [];
        }
        accumulator[track.cluster].push(track);
        return accumulator;
      };
    const clusters = tracks.reduce(clusterer, {});
    // multiple align each cluster's tracks
    const aligner = (accumulator, [i, tracks]) => {
        // prepare the data
        const trackFamilies = tracks.map((t) => t.families);
        const l = trackFamilies[0].length;
        const flattenedTracks = [].concat.apply([], trackFamilies);
        const characters = new Set(flattenedTracks);
        const omit = new Set();
        // construct and train the model
        const hmm = new GCV.graph.MSAHMM(l, characters);
        hmm.train(trackFamilies, {reverse: true, omit, surgery: true});
        // align the tracks
        const alignments = trackFamilies.map((f) => hmm.align(f));
        const mixin = (t, i) => {
            const t2 = Object.create(t);
            t2.alignment = alignments[i];
            return t2;
          };
        const alignedTracks = tracks.map(mixin);
        const consensus = hmm.consensus();
        accumulator.consensuses[i] = hmm.consensus();
        accumulator.tracks.push(...alignedTracks);
        return accumulator;
      };
    const clusteredAlignments = {
        consensuses: new Array(Object.keys(clusters).length),
        tracks: []
      };
    const alignedClusters =
      Object.entries(clusters).reduce(aligner, clusteredAlignments);
    return clusteredAlignments;
  },
);
