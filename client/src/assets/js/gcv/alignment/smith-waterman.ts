import { computeScore, matrix } from "./alignment";

/**
 * The Smith-Waterman algorithm.
 * @param {Array} sequence - The sequence to be aligned.
 * @param {Array} reference - The sequence to be aligned to.
 * @param {object} options - Optional parameters.
 * @return {Array} - The aligned sequences and score.
 */
export default function smithWaterman(sequence, reference, options) {

  /**
   * The actual alignment algorithm.
   * @param {Array} seq - The sequence being aligned to.
   * @param {Array} ref - The sequence being aligned.
   * @return {object} - The hidden iframe.
   */
  function align(seq, ref) {
    // initialize letiables
    const rows = ref.length + 1;
    const cols = seq.length + 1;
    const a = matrix(rows, cols, 0);
    let i = 0;
    let j = 0;
    const choice = [0, 0, 0, 0];
    // populate the matrix
    let max = 0;
    let iMax = 0;
    let jMax = 0;
    for (i = 1; i < rows; i++) {
      for (j = 1; j < cols; j++) {
        choice[0] = 0;
        choice[1] = a[i - 1][j - 1] + computeScore(
          ref[i - 1], seq[j - 1], options.accessor, options.scores,
        );
        choice[2] = a[i - 1][j] + options.scores.gap;
        choice[3] = a[i][j - 1] + options.scores.gap;
        a[i][j] = Math.max.apply(null, choice);
        if (a[i][j] >= max) {
          max = a[i][j];
          iMax = i;
          jMax = j;
        }
      }
    }
    // traceback
    i = iMax;
    j = jMax;
    let diag;
    let up;
    let left;
    let score = max;
    const outRef = [];
    const outSeq = [];
    while (i > 0 && j > 0) {
      score = a[i][j];
      if (score === 0) {
        break;
      }
      diag = a[i - 1][j - 1];
      up = a[i][j - 1];
      left = a[i - 1][j];
      if (score === diag + computeScore(
        ref[i - 1], seq[j - 1], options.accessor, options.scores,
      )) {
        outRef.unshift(ref[i - 1]);
        outSeq.unshift(seq[j - 1]);
        i -= 1;
        j -= 1;
      } else if (score === left + options.scores.gap) {
          outRef.unshift(ref[i - 1]);
          outSeq.unshift(null);
          i -= 1;
      } else if (score === up + options.scores.gap) {
        outRef.unshift(null);
        outSeq.unshift(seq[j - 1]);
        j -= 1;
      } else {
        break;
      }
    }
    while (j > 0) {
      outRef.unshift(null);
      outSeq.unshift(seq[j - 1]);
      j -= 1;
    }
    return {sequence: outSeq, reference: outRef, score: max};
  }

  // parse optional parameters
  options = options || {};
  options.accessor = options.accessor || ((e) => e);
  options.scores = options.scores || {};
  options.scores.match = options.scores.match || 5;
  options.scores.mismatch = options.scores.mismatch || 0;
  options.scores.gap = options.scores.gap || -1;
  options.reverse = options.reverse || ((s) => {
      const r = s.slice();
      r.reverse();
      return r;
    });

  // perform forward and reverse alignments
  const forward = align(sequence, reference);
  const reverseReference = options.reverse(reference);
  const reverse = align(sequence, reverseReference);

  // output the highest scoring alignment
  const output = forward.score >= reverse.score ? forward : reverse;
  return [output];
}
