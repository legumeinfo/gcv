import { clone }                from '../common';
import { computeScore, matrix } from './alignment';


/** The Repeat algorithm by Durbin et al. */
export default function repeat (sequence, reference, options) {

  /**
    * The alignment algorithm.
    * @param {Array} seq - The sequence being aligned to.
    * @param {Array} ref - The sequence being aligned.
    * @return {object} - The hidden iframe.
    */
  var align = function (seq, ref) {
    // populate the matrix
    var rows = seq.length + 1,  // first item is at index 1
        cols = ref.length + 1,  // first item is at index 1
        a = matrix(cols, rows, 0);
    var i; // cols
    var choice = [0, 0, 0, 0];
    for (i = 1; i < cols; i++) {  // first column is all 0's
      // handle unmatched regions and ends of matches
      var scores = a[i - 1].map(function (score, j) {
        return (j > 0) ? score - options.scores.threshold : score;
      });
      a[i][0] = Math.max.apply(null, scores);
      // handle starts of matches and extensions
      for (j = 1; j < rows; j++) {
        choice[0] = a[i][0];
        choice[1] = a[i - 1][j - 1] + computeScore(
          ref[i - 1], seq[j - 1], options.accessor, options.scores
        );
        // adding because passed value should be negative
        choice[2] = a[i - 1][j] + options.scores.gap;
        choice[3] = a[i][j - 1] + options.scores.gap;
        a[i][j] = Math.max.apply(null, choice);
      }
    }
    var str = '';
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        str += '\t' + a[i][j].toString();
      }
      str += '\n';
    }
    // traceback - make a track for each qualified path in the matrix   
    i = cols - 1;  // start in the extra cell
    var j = 0,  // rows
        alignments = [],
        index = -1,
        saving = false,
        length = 0;
    while (!(i == 0 && j == 0)) {
      if (j == 0) {
        if (saving && length < 2) {
          alignments.pop();
          index--;
          length = 0;
        }
        saving = false;
        var max = Math.max.apply(null, a[i]);
        var jMax = a[i].lastIndexOf(max);
        // start a new alignment only if j is a match and the alignment's
        // score meets the threshold
        // TODO: why is the matrix not being used?
        if (jMax > 0 && i > 0 &&
        options.accessor(ref[i - 1]) === options.accessor(seq[jMax - 1]) &&
        max >= options.scores.threshold) {
          length = 1;
          saving = true;
          j = jMax;
          alignments.push({sequence: [], reference: [], score: max});
          index++;
          // pad seq with the genes not traversed by the alignment
          for (var k = seq.length - 1; k >= j; k--) {
            alignments[index].sequence.unshift(clone(seq[k]));
            alignments[index].reference.unshift(null);
          }
          // add the starting match
          alignments[index].sequence.unshift(clone(seq[j - 1]));
          alignments[index].reference.unshift(clone(ref[i - 1]));
          if (options.suffixScores)
            alignments[index].reference[0].suffixScore = a[i][j];
        } else {
          // try starting an alignment in the next column
          i--;
        }
      } else if (i == 0) {
        j = 0;
      } else {
        // diag, up, left
        let scores = [a[i - 1][j - 1], a[i][j - 1], a[i - 1][j]];
        var max = Math.max.apply(null, scores);
        // stop alignment if a 0 cell was reached
        if (max == 0) {
          // add any missing genes to seq
          if (saving) {
            for (var k = j - 1; k > 0; k--) {
              alignments[index].sequence.unshift(clone(seq[k - 1]));
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
                alignments[index].sequence.unshift(clone(seq[j - 1]));
                alignments[index].reference.unshift(clone(ref[i - 1]));
                if (options.suffixScores)
                  alignments[index].reference[0].suffixScore = a[i][j];
                length++;
              }
              break;
            // up
            case 1:
              j--;
              if (saving && j > 0) {
                alignments[index].sequence.unshift(clone(seq[j - 1]));
                alignments[index].reference.unshift(null);
              }
              break;
            // left
            case 2:
              i--;
              if (saving && i > 0) {
                alignments[index].sequence.unshift(null);
                alignments[index].reference.unshift(clone(ref[i - 1]));
                if (options.suffixScores)
                  alignments[index].reference[0].suffixScore = a[i][j];
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
  var options              = options || {};
  options.accessor         = options.accessor || function (e) { return e; };
  options.scores           = options.scores || {};
  options.scores.match     = options.scores.match || 5;
  options.scores.mismatch  = options.scores.mismatch || 0;
  options.scores.gap       = options.scores.gap || -1;
  options.scores.threshold = options.scores.threshold || 10;
  options.suffixScores     = options.suffixScores || false;
  options.reverse          = options.reverse || function (s) {
    var r = s.slice();
    r.reverse();
    return r;
  };

  // perform forward and reverse alignments
	var forwards = align(sequence, reference),
      reverseReference = options.reverse(reference);
	var reverses = align(sequence, reverseReference);

  // clone each object in the arrays and flip the strand for each selected gene
  var output = forwards.concat(reverses);
	return output;
}
