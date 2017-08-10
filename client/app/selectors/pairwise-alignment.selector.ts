import { ALIGNMENT_ALGORITHMS } from '../constants/alignment-algorithms';
import { MicroTracks } from '../models/micro-tracks.model';

declare var Alignment: any;
declare var GCV: any;
declare var Graph: any;

export const pairwiseAlignmentSelector = () => {
  let algorithms = ALIGNMENT_ALGORITHMS;
  let algorithmIDs = algorithms.map(a => a.id);

  return state => state.map(([tracks, params]) => {
    let algorithm = algorithms[algorithmIDs.indexOf(
      params.algorithm
    )].algorithm;
    let query = tracks.groups[0];
    let options = Object.assign({}, {
      accessor: g => g.family,
      suffixScores: true
    });
    options.scores = Object.assign({}, params);
    let alignments = [];
    for (let i = 1; i < tracks.groups.length; ++i) {
      let result = tracks.groups[i];
      let al = algorithm(query.genes, result.genes, options);
      let id = result.id;
      // save tracks that meet the threshold
      for (let j = 0; j < al.length; ++j) {
        let a = al[j];
        if (a.score >= options.scores.threshold) {
          a.track = Object.assign({}, result);
          alignments.push(a);
        }
      }
    }
    // convert the alignments into tracks
    let alignedTracks = Alignment.trackify(tracks, alignments);
    // merge tracks from same alignment set remove residual suffix scores
    var mergedTracks = GCV.merge(alignedTracks);
    for (let i = 1; i < mergedTracks.groups.length; ++i) {
      let genes = mergedTracks.groups[i].genes;
      for (let j = 0; j < genes.length; ++j) {
        delete genes[j].suffixScore;
      }
    }
    // TODO: move to standalone filter
    mergedTracks.groups = mergedTracks.groups.filter((g, i) => {
      return i == 0 || g.score >= params.score;
    });
    return mergedTracks;
  });
};
