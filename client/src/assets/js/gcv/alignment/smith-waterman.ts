import { clone }                from '../common';
import { computeScore, matrix } from './alignment';


/**
  * The Smith-Waterman algorithm.
  * @param {Array} sequence - The sequence to be aligned.
  * @param {Array} reference - The sequence to be aligned to.
  * @param {object} options - Optional parameters.
  * @return {Array} - The aligned sequences and score.
  */
export default function smithWaterman (sequence, reference, options) {

  /**
    * The alignment algorithm.
    * @param {Array} seq - The sequence being aligned to.
    * @param {Array} ref - The sequence being aligned.
    * @return {object} - The hidden iframe.
    */
  var align = function (seq, ref) {
    // initialize variables
    var rows = ref.length + 1,
        cols = seq.length + 1,
        a = matrix(rows, cols, 0);
    var i = 0,
        j = 0;
    var choice = [0, 0, 0, 0];
    // populate the matrix
    var max = 0,
        iMax = 0,
        jMax = 0;
    for (i = 1; i < rows; i++) {
      for (j = 1; j < cols; j++) {
        choice[0] = 0;
        choice[1] = a[i - 1][j - 1] + computeScore(
          ref[i - 1], seq[j - 1], options.accessor, options.scores
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
    var diag, up, left,
        score = max,
        outRef = [],
        outSeq = [];
    while (i > 0 && j > 0) {
      score = a[i][j];
      if (score == 0) {
        break;
      }
      diag = a[i - 1][j - 1];
      up = a[i][j - 1];
      left = a[i - 1][j];
      if (score == diag + computeScore(
        ref[i - 1], seq[j - 1], options.accessor, options.scores
      )) {
        outRef.unshift(clone(ref[i - 1]));
        outSeq.unshift(clone(seq[j - 1]));
        i -= 1;
        j -= 1;
      } else if (score == left + options.scores.gap) {
          outRef.unshift(clone(ref[i - 1]));
          outSeq.unshift(null);
          i -= 1;
      } else if (score == up + options.scores.gap) {
        outRef.unshift(null);
        outSeq.unshift(clone(seq[j - 1]));
        j -= 1;
		  } else {
      	break;
      }
    }
    while (j > 0) {
      outRef.unshift(null);
      outSeq.unshift(clone(seq[j - 1]));
      j -= 1;
    }
    return {sequence: outSeq, reference: outRef, score: max};
  }

  // parse optional parameters
  var options = options || {};
  options.accessor = options.accessor || function (e) { return e; };
  options.scores = options.scores || {};
  options.scores.match = options.scores.match || 5;
  options.scores.mismatch = options.scores.mismatch || 0;
  options.scores.gap = options.scores.gap || -1;

  // perform forward and reverse alignments
	var forward = align(sequence, reference),
      reverseReference = reference.slice(0);
	reverseReference.reverse();
	var reverse = align(sequence, reverseReference);

  // output the highest scoring alignment
  var output;
	if (forward.score >= reverse.score) {
    output = forward
	} else {
    // clone each element in the array and flip the strand
    for (var i = 0; i < reverse.reference.length; i++) {
      if (reverse.reference[i] != null) {
        reverse.reference[i].strand = -reverse.reference[i].strand;
      }
    }
    output = reverse;
  }
  return [output];
}
