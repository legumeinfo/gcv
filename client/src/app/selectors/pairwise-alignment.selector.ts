import { ALIGNMENT_ALGORITHMS } from '../constants/alignment-algorithms';
import { MicroTracks }          from '../models/micro-tracks.model';
import { GCV }                  from '../../assets/js/gcv';

export const pairwiseAlignmentSelector = () => {
  let algorithms = ALIGNMENT_ALGORITHMS;
  let algorithmIDs = algorithms.map(a => a.id);

  return state => state.map(([tracks, params]) => {
    let alignedTracks = JSON.parse(JSON.stringify(tracks));
    if (alignedTracks !== undefined && params !== undefined) {
      let algorithm = algorithms[algorithmIDs.indexOf(
        params.algorithm
      )].algorithm;
      let query = alignedTracks.groups[0];
      let options = Object.assign({}, {
        accessor: g => (g.strand == -1 ? '-' : '+') + g.family,
        reverse: s => {
          let r = JSON.parse(JSON.stringify(s));
          r.reverse();
          r.forEach(g => g.strand *= -1);
          return r;
        },
        suffixScores: true,
        scores: Object.assign({}, params)
      });
      let alignments = [];
      for (let i = 1; i < alignedTracks.groups.length; ++i) {
        let result = alignedTracks.groups[i];
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
      alignedTracks = GCV.alignment.trackify(alignedTracks, alignments);
      // merge tracks from same alignment set remove residual suffix scores
      alignedTracks = GCV.alignment.merge(alignedTracks);
      for (let i = 1; i < alignedTracks.groups.length; ++i) {
        let genes = alignedTracks.groups[i].genes;
        for (let j = 0; j < genes.length; ++j) {
          delete genes[j].suffixScore;
        }
      }
      // TODO: move to standalone filter
      alignedTracks.groups = alignedTracks.groups.filter((g, i) => {
        return i == 0 || g.score >= params.score;
      });
    }
    return alignedTracks;
  });
};
