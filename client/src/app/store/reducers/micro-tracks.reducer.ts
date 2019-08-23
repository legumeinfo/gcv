// A micro-track is an instance of Track that represents a slice of a
// chromosome, rather than a chromosome in its entirety. This file provides an
// NgRx reducer and selectors for storing and accessing micro-track data.
//
// There are two types of micro-tracks in the GCV - those derived from the genes
// provided by the user and those similar to the aforementioned. Since the
// entire chromosome for each gene provided by the user is loaded as a Track
// (see ./chromosome.reducer.ts) the micro-tracks for the genes provided by the
// user are derived from their respective chromosome Tracks via a selector and
// aren't explicitly stored by the micro-tracks reducer.
//
// Clustered and multiple aligned versions of the user defined micro-tracks are
// available via selectors. The multiple alignment selector aligns the Tracks
// within each cluster and returns an object containing the aligned tracks and
// an array of consensus sequences - one for each cluster's multiple alignment.
// These consensus sequences are what's used to find micro-tracks that are
// similar to each cluster. The similar micro-tracks found are what's stored by
// the micro-tracks reducer. Similar to the micro-tracks derived from the genes
// provided by the user, aligned versions of the similar micro-tracks are
// available via a selector. In this case, the micro-tracks are pairwise aligned
// to the consensus sequence they correspond to.

// NgRx
import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
// store
import * as fromChromosome from "./chromosome.reducer";
import * as fromGene from "./gene.reducer";
import * as fromRouter from "./router.reducer";
import * as microTrackActions from "../actions/micro-tracks.actions";
// app
import * as clusterfck from "../../../assets/js/clusterfck";
import { GCV } from "../../../assets/js/gcv";
import { ALIGNMENT_ALGORITHMS } from "../../algorithms";
import { AlignmentParams, ClusteringParams, Gene, Track } from "../../models";
import { AlignmentMixin, ClusterMixin } from "../../models/mixins";

declare var Object: any;  // because TypeScript doesn't support Object.values

export type MicroTrackID = {
  cluster: number,
  startGene: string,
  stopGene: string,
  source: string
};

export type PartialMicroTrackID = {
  cluster: number;
  source: string;
};

const microTrackID = (cluster: number, startGene: string, stopGene: string,
source: string) => {
  return `${cluster}:${startGene}:${stopGene}:${source}`;
};

function partialMicroTrackID(cluster: number, source: string): string;
function partialMicroTrackID({cluster, source}): string;
function partialMicroTrackID(...args): string {
  if (typeof args[0] === "object") {
    const id = args[0];
    return partialMicroTrackID(id.cluster, id.source);
  }
  const [cluster, source] = args;
  return `${cluster}:${source}`;
};

const adapter = createEntityAdapter<(Track | ClusterMixin)>({
  selectId: (e) => {
    const track = e as Track;
    const cluster = e as ClusterMixin;
    const startGene = track.genes[0];
    const stopGene = track.genes[track.genes.length-1];
    return microTrackID(cluster.cluster, startGene, stopGene, track.source);
  }
});

// TODO: is loaded even necessary or can it be derived from entity ids?
export interface State extends EntityState<(Track | ClusterMixin)> {
  failed: PartialMicroTrackID[];
  loaded: PartialMicroTrackID[];
  loading: PartialMicroTrackID[];
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
    {
      const partialID = {
          cluster: action.payload.cluster,
          source: action.payload.source,
        };
      return {
        ...state,
        loading: state.loading.concat([partialID]),
      };
    }
    case microTrackActions.SEARCH_SUCCESS:
    {
      const tracks = action.payload.tracks;
      const partialID = {
          cluster: action.payload.cluster,
          source: action.payload.source,
        };
      return adapter.addMany(
        tracks,
        {
          ...state,
          loaded: state.loaded.concat(partialID),
          loading: state.loading.filter(({cluster, source}) => {
            return !(cluster === partialID.cluster &&
                     source === partialID.source);
          }),
        },
      );
    }
    case microTrackActions.SEARCH_FAILURE:
    {
      const partialID = {
          cluster: action.payload.cluster,
          source: action.payload.source,
        };
      return {
        ...state,
        failed: state.failed.concat(partialID),
        loading: state.loading.filter(({cluster, source}) => {
          return !(cluster === partialID.cluster &&
                   source === partialID.source);
        }),
      };
    }
    default:
      return state;
  }
}

export const getMicroTracksState = createFeatureSelector<State>("microTracks");

export const getLoadedMicroTracks = createSelector(
  getMicroTracksState,
  // TODO: can initialState be handled upstream?
  (state=initialState) => Object.values(state.entities),
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

export const getClusterIDs = createSelector(
  getClusteredSelectedMicroTracks,
  (tracks: (Track | ClusterMixin)[]): number[] => {
    const IDs = tracks.map((t: ClusterMixin) => t.cluster);
    const uniqueIDs = new Set(IDs);
    return Array.from(uniqueIDs);
  },
);

// performs a multiple sequence alignment of the tracks in each cluster and
// outputs the aligned tracks and their consensus sequence
export const getClusteredAndAlignedSelectedMicroTracks = createSelector(
  getClusteredSelectedMicroTracks,
  (tracks: (Track | ClusterMixin)[]):
  {
    consensuses: string[][],
    tracks: (Track | ClusterMixin | AlignmentMixin)[]
  } => {
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

export const getClusteredAndAlignedSearchMicroTracks = createSelector(
  getMicroTracksState,
  getClusteredAndAlignedSelectedMicroTracks,
  fromRouter.getMicroAlignmentParams,
  (state: State, {consensuses, tracks}, params: AlignmentParams):
  (Track | ClusterMixin | AlignmentMixin)[] => {
    // get selected alignment algorithm
    const algorithmIDs = ALIGNMENT_ALGORITHMS.map((a) => a.id);
    const algorithmID = algorithmIDs.indexOf(params.algorithm);
    const algorithm = ALIGNMENT_ALGORITHMS[algorithmID].algorithm;
    // creates an alignment mixin for the given track
    const mixin = (track, alignment) => {
        const t = Object.create(track);
        t.alignment = alignment.alignment;
        t.score = alignment.score;
        return t;
      };
    // returns one or more alignments (depending on the alignment algorithm) for
    // the given sequence relative to the given reference
    const aligner = (reference, sequence) => {
        const options = {
            omit: new Set(""),
            scores: Object.assign({}, params),
          };
        const alignments = algorithm(reference, sequence);
        // TODO: combine repeat tracks
        return alignments;
      };
    // aligns each track to its cluster's consensus sequence, creates an
    // alignment mixin for each track's alignments, and return a flattened array
    const reducer = (accumulator, track) => {
        const cluster = (track as ClusterMixin).cluster;
        const consensus = consensuses[cluster];
        const families = (track as Track).families;
        const alignments = aligner(consensus, families);
        const trackAlignments = alignments.map((a) => mixin(track, a));
        accumulator.push(...trackAlignments);
        return accumulator;
      };
    // align the tracks
    const searchTracks = Object.values(state.entities);
    const alignedTracks = searchTracks.reduce(reducer, []);
    return alignedTracks;
  },
);

export const getAllClusteredAndAlignedMicroTracks = createSelector(
  getClusteredAndAlignedSelectedMicroTracks,
  getClusteredAndAlignedSearchMicroTracks,
  ({consensuses, tracks}, searchTracks):
  (Track | ClusterMixin | AlignmentMixin)[] => {
    return tracks.concat(searchTracks);
  },
);

export const getAlignedMicroTrackCluster = (id: number) => createSelector(
  getAllClusteredAndAlignedMicroTracks,
  (tracks) => {
    const cluster = tracks.filter((t: ClusterMixin) => t.cluster === id);
    return cluster;
  },
);
