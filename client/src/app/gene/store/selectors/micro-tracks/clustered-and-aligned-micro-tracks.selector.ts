// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/micro-tracks.reducer';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { getSelectedChromosomesLoaded }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import { getSelectedGenesLoaded } from '@gcv/gene/store/selectors/gene';
import { getMicroTracksState } from './micro-tracks-state.selector';
import { getSelectedMicroTracks } from './selected-micro-tracks.selector';
// app
import * as clustering from '@gcv-assets/js/clustering';
import { GCV } from '@gcv-assets/js/gcv';
import { arrayFlatten, memoizeArray, memoizeObject } from '@gcv/core/utils';
import { ALIGNMENT_ALGORITHM_MAP, MICRO_ORDER_ALGORITHM_MAP }
  from '@gcv/gene/algorithms';
import { microRegexpFactory } from '@gcv/gene/algorithms/utils';
import { Track } from '@gcv/gene/models';
import { AlignmentParams, ClusteringParams } from '@gcv/gene/models/params';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { familyCountMap } from '@gcv/gene/models/shims';


// clustered


// clusters micro tracks based on their families
// TODO: only cluster when selectedLoaded emits true
export const getClusteredSelectedMicroTracks =
createSelectorFactory(memoizeArray)(
  getSelectedGenesLoaded,
  getSelectedChromosomesLoaded,
  getSelectedMicroTracks,
  fromParams.getClusteringParams,
  (genesLoaded: boolean, chromosomesLoaded: boolean, tracks: Track[],
  params: ClusteringParams): (Track & ClusterMixin)[] => {
    // TODO: should this also check that the selected IDs lists are non-empty?
    if (!genesLoaded || !chromosomesLoaded) {
      return [];
    }
    const metric = (a: Track, b: Track): number => {
        const f1 = a.families;
        const f2 = b.families;
        const f3 = [...f2].reverse();
        const d1 = GCV.metrics.levenshtein(f1, f2);
        const d2 = GCV.metrics.levenshtein(f1, f3);
        return Math.min(d1, d2);
      };
    const clusters =
      clustering.hcluster(tracks, metric, params.linkage, params.cthreshold);
    const recurrence = (cluster) => {
        const elements = [];
        if ('left' in cluster && 'right' in cluster) {
          if (cluster['left']['size'] >= cluster['right']['size']) {
            elements.push(...recurrence(cluster['left']));
            elements.push(...recurrence(cluster['right']));
          } else {
            elements.push(...recurrence(cluster['right']));
            elements.push(...recurrence(cluster['left']));
          }
        } else {
          elements.push(cluster['value']);
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

export const getSelectedMicroTracksForCluster =
(id: number) => createSelectorFactory(memoizeArray)(
  getClusteredSelectedMicroTracks,
  (tracks: (Track & ClusterMixin)[]): (Track & ClusterMixin)[] => {
    const filteredTracks = tracks.filter((t: ClusterMixin) => t.cluster === id);
    return filteredTracks;
  }
);

// NOTE: not memoized because successive distinct clusters could have same IDs
export const getClusterIDs = createSelector(
  getClusteredSelectedMicroTracks,
  (tracks: (Track & ClusterMixin)[]): number[] => {
    const IDs = tracks.map((t: ClusterMixin) => t.cluster);
    const uniqueIDs = new Set(IDs);
    return Array.from(uniqueIDs);
  },
);


// clustered and aligned


// performs a multiple sequence alignment of the selected tracks in each cluster
// and outputs the aligned tracks and their consensus sequence
export const getClusteredAndAlignedSelectedMicroTracks =
createSelectorFactory(memoizeObject)(
  getClusteredSelectedMicroTracks,
  (tracks: (Track & ClusterMixin)[]):
  {consensuses: string[][], tracks: (Track & ClusterMixin & AlignmentMixin)[]} =>
  {
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
        const flattenedTracks: string[] = arrayFlatten(trackFamilies);
        //const characters = new Set(flattenedTracks);
        const familyCounts = familyCountMap(flattenedTracks);
        const characters = new Set();
        const omit = new Set();
        Object.entries(familyCounts).forEach(([family, count]) => {
          if (count == 1 || family == '') {
            omit.add(family);
          } else {
            characters.add(family);
          }
        });
        // construct and train the model
        const mixinFactory = (alignments) => (t, i) => {
            return Object.assign(Object.create(t), alignments[i]);
          };
        // msa via hmm
        if (characters.size > 0 && tracks.length > 1) {
          const hmm = new GCV.graph.MSAHMM(l, characters);
          hmm.train(trackFamilies, {reverse: true, omit});
          // align the tracks
          const alignments = trackFamilies.map((f,i) => {
              return hmm.align(f, {inversions: false});
            });
          const alignedTracks = tracks.map(mixinFactory(alignments));
          accumulator.consensuses[i] = hmm.consensus();
          accumulator.tracks.push(...alignedTracks);
        // edge case where all families are orphans or singletons
        } else {
          const alignments = trackFamilies.map((families) => {
              return {
                alignment: families.map((f, i) => i),
                orientations: Array(families.length).fill(1),
                segments: Array(families.length).fill(0),
                score: 0,
              };
            });
          const alignedTracks = tracks.map(mixinFactory(alignments));
          // TODO: is this really the best way to handle 1 track vs poorly
          // clustered tracks
          if (tracks.length == 1) {
            accumulator.consensuses[i] = trackFamilies[0];
          } else {
            accumulator.consensuses[i] = [];
          }
          accumulator.tracks.push(...alignedTracks);
        }
        return accumulator;
      };
    const clusteredAlignments = {
        consensuses: new Array(Object.keys(clusters).length),
        tracks: []
      };
    Object.entries(clusters).reduce(aligner, clusteredAlignments);
    return clusteredAlignments;
  },
);

export const getSearchMicroTracks = createSelectorFactory(memoizeArray)(
  getMicroTracksState,
  (state: State): (Track & ClusterMixin)[] => Object.values(state.entities),
);

// only returns the search micro-tracks for the currently selected sources
export const getActiveSearchMicroTracks = createSelectorFactory(memoizeArray)(
  getSearchMicroTracks,
  fromParams.getSourceParams,
  (tracks: (Track & ClusterMixin)[], {sources}): (Track & ClusterMixin)[] => {
    return tracks.filter((t) => sources.indexOf(t.source) != -1);
  }
);

// pairwise aligns each search result track to its cluster's consensus track
export const getClusteredAndAlignedSearchMicroTracks =
createSelectorFactory(memoizeArray)(
  getActiveSearchMicroTracks,
  getClusteredAndAlignedSelectedMicroTracks,
  fromParams.getAlignmentParams,
  (searchTracks: (Track & ClusterMixin)[], {consensuses, tracks},
  params: AlignmentParams): (Track & ClusterMixin & AlignmentMixin)[] => {
    // get selected alignment algorithm
    const algorithm = ALIGNMENT_ALGORITHM_MAP[params.algorithm].algorithm;
    // creates an alignment mixin for the given track
    const mixin = (track, alignment) => {
        return Object.assign(Object.create(track), alignment);
      };
    // returns one or more alignments (depending on the alignment algorithm) for
    // the given sequence relative to the given reference
    const aligner = (reference, sequence) => {
        const options = {
            omit: new Set(['']),
            scores: Object.assign({}, params),
            carryover: false,
          };
        const alignments = algorithm(reference, sequence, options);
        // TODO: combine repeat tracks
        return alignments;
      };
    // aligns each track to its cluster's consensus sequence, creates an
    // alignment mixin for each track's alignments, and return a flattened array
    const reducer = (accumulator, track, i) => {
        const consensus = consensuses[track.cluster];
        const alignments = aligner(consensus, track.families);
        const trackAlignments = alignments
          .map((a) => mixin(track, a))
          .filter((t) => t.score >= params.score);
        accumulator.push(...trackAlignments);
        return accumulator;
      };
    // align the tracks
    const alignedTracks = searchTracks.reduce(reducer, []);
    return alignedTracks;
  },
);

export const getAllClusteredAndAlignedMicroTracks =
createSelectorFactory(memoizeArray)(
  getClusteredAndAlignedSelectedMicroTracks,
  getClusteredAndAlignedSearchMicroTracks,
  fromParams.getMicroFilterParams,
  fromParams.getMicroOrderParams,
  ({consensuses, tracks}, searchTracks, {regexp}, {order}):
  (Track & ClusterMixin & AlignmentMixin)[] => {
    const orderAlg = (order in MICRO_ORDER_ALGORITHM_MAP) ?
      MICRO_ORDER_ALGORITHM_MAP[order].algorithm as
      (a: AlignmentMixin & ClusterMixin & Track, b: AlignmentMixin & ClusterMixin & Track) => number :
      (t1, t2) => 0;
    const trackFilter = microRegexpFactory(regexp).algorithm;
    const sortedTracks = [...tracks].sort(orderAlg);
    const sortedSearchTracks = trackFilter(searchTracks).sort(orderAlg);
    return sortedTracks.concat(sortedSearchTracks);
  },
);

export const getAlignedMicroTrackCluster =
(id: number) => createSelectorFactory(memoizeArray)(
  getAllClusteredAndAlignedMicroTracks,
  (tracks) => {
    const cluster = tracks.filter((t: ClusterMixin) => t.cluster === id);
    return cluster;
  },
);
