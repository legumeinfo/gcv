import { computeScore, matrix } from "./alignment";

/** The Repeat algorithm by Durbin et al. */
export default function repeat(sequence, reference, options) {

  /**
   * The alignment algorithm.
   * @param {Array} seq - The sequence being aligned to.
   * @param {Array} ref - The sequence being aligned.
   * @return {object} - The hidden iframe.
   */
  function align(seq, ref) {
    // populate the matrix
    const rows = seq.length + 1;  // first item is at index 1
    const cols = ref.length + 1;  // first item is at index 1
    const a = matrix(cols, rows, 0);
    const choice = [0, 0, 0, 0];
    for (let i = 1; i < cols; i++) {  // first column is all 0"s
      // handle unmatched regions and ends of matches
      const scores = a[i - 1].map((score, j) => {
        return (j > 0) ? score - options.scores.threshold : score;
      });
      a[i][0] = Math.max.apply(null, scores);
      // handle starts of matches and extensions
      for (let j = 1; j < rows; j++) {
        choice[0] = a[i][0];
        choice[1] = a[i - 1][j - 1] + computeScore(
          ref[i - 1], seq[j - 1], options.accessor, options.scores, options.ignore,
        );
        // adding because passed value should be negative
        choice[2] = a[i - 1][j] + options.scores.gap;
        choice[3] = a[i][j - 1] + options.scores.gap;
        a[i][j] = Math.max.apply(null, choice);
      }
    }
    let str = "";
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        str += "\t" + a[i][j].toString();
      }
      str += "\n";
    }
    // traceback - make a track for each qualified path in the matrix
    let i = cols - 1;  // start in the extra cell
    let j = 0;  // rows
    const alignments = [];
    let index = -1;
    let saving = false;
    let length = 0;
    while (!(i === 0 && j === 0)) {
      if (j === 0) {
        if (saving && length < 2) {
          alignments.pop();
          index--;
          length = 0;
        }
        saving = false;
        const max = Math.max.apply(null, a[i]);
        const jMax = a[i].lastIndexOf(max);
        // start a new alignment only if j is a match and the alignment's
        // score meets the threshold
        // TODO: why is the matrix not being used?
        const ref_f = options.accessor(ref[i - 1]);
        const seq_f = options.accessor(seq[jMax - 1]);
        if (jMax > 0 && i > 0 && ref_f === seq_f &&
        options.ignore.indexOf(ref_f) === -1 && max >= options.scores.threshold) {
          length = 1;
          saving = true;
          j = jMax;
          alignments.push({sequence: [], reference: [], score: max});
          index++;
          // pad seq with the genes not traversed by the alignment
          for (let k = seq.length - 1; k >= j; k--) {
            alignments[index].sequence.unshift(seq[k]);
            alignments[index].reference.unshift(null);
          }
          // add the starting match
          alignments[index].sequence.unshift(seq[j - 1]);
          alignments[index].reference.unshift(ref[i - 1]);
          if (options.suffixScores) {
            alignments[index].reference[0].score = a[i][j];
          }
        } else {
          // try starting an alignment in the next column
          i--;
        }
      } else if (i === 0) {
        j = 0;
      } else {
        // diag, up, left
        const scores = [a[i - 1][j - 1], a[i][j - 1], a[i - 1][j]];
        const max = Math.max.apply(null, scores);
        // stop alignment if a 0 cell was reached
        if (max === 0) {
          // add any missing genes to seq
          if (saving) {
            for (let k = j - 1; k > 0; k--) {
              alignments[index].sequence.unshift(seq[k - 1]);
              alignments[index].reference.unshift(null);
            }
          }
          // get ready for a new alignment
          i--;
          j = 0;
        } else {
          switch (scores.lastIndexOf(max)) {
            // diag
            case 0:
              j--;
              i--;
              // no alignments happen in the first row or column
              if (saving && j > 0 && i > 0) {
                alignments[index].sequence.unshift(seq[j - 1]);
                alignments[index].reference.unshift((ref[i - 1]));
                if (options.suffixScores) {
                  alignments[index].reference[0].score = a[i][j];
                }
                length++;
              }
              break;
            // up
            case 1:
              j--;
              if (saving && j > 0) {
                alignments[index].sequence.unshift(seq[j - 1]);
                alignments[index].reference.unshift(null);
              }
              break;
            // left
            case 2:
              i--;
              if (saving && i > 0) {
                alignments[index].sequence.unshift(null);
                alignments[index].reference.unshift(ref[i - 1]);
                if (options.suffixScores) {
                  alignments[index].reference[0].score = a[i][j];
                }
              }
              break;
          }
        }
      }
    }
    if (saving && length < 2) {
      alignments.pop();
      index--;
      length = 0;
    }
    return alignments;
  }

  // parse optional parameters
  options = options || {};
  options.accessor = options.accessor || ((e) => e);
  options.scores = options.scores || {};
  options.scores.match = options.scores.match || 5;
  options.scores.mismatch = options.scores.mismatch || 0;
  options.scores.gap = options.scores.gap || -1;
  options.scores.threshold = options.scores.threshold || 10;
  options.suffixScores = options.suffixScores || false;
  options.ignore = options.ignore || [];
  options.reverse = options.reverse || ((s) => {
      const r = s.slice();
      r.reverse();
      return r;
    });

  // perform forward and reverse alignments
  const forwards = align(sequence, reference);
  const reverseReference = options.reverse(reference);
  const reverses = align(sequence, reverseReference);

  // clone each object in the arrays and flip the strand for each selected gene
  const output = forwards.concat(reverses);
  return output;
}
