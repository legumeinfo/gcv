// library
import { matrix, setOption, sum } from "../common";
import { Alignment, InternalAlignment, Scores, Traceback } from "./models";
import { computeScore, mergeAlignments } from "./utils";


/**
 * Aligns the given sequence to the given reference using the Smith-Waterman
 * alignment algorithm.
 * @param {Array<T>} seq - The sequence to be aligned to the refernece.
 * @param {Array<T>} ref - The reference to align the sequence to.
 * @param {Scores} scores - An object defining the (mis)match and gap values to
 * be used during scoring.
 * @param {Set<T>} omit - A set of elements to be considered unmatchable.
 * @return {InternalAlignment} - An alignment object with a "coordinates"
 * attribute that is an array describing each reference element's aligned
 * position in the sequence (null if it wasn't aligned) and a "scores" attribute
 * that is an array describing what each element in the reference contributes to
 * the alignment's score (null if the element wasn't aligned).
 * Ex: TODO
 */
function align<T>(
  seq: T[],
  ref: T[],
  scores: Scores,
  omit: Set<T>=new Set): InternalAlignment
{

  // construct score and traceback matrices
  const cols = ref.length + 1;  // first item is at index 1
  const rows = seq.length + 1;  // ditto
  const m = matrix(cols, rows, 0);  // scores
  const t = matrix(cols, rows, [0, 0]);  // traceback
  let max = 0;
  let maxCell = [0, 0];
  for (let i = 1; i < cols; i++) {
    for (let j = 1; j < rows; j++) {
      const choices = [
          0,
          m[i-1][j-1] + computeScore(ref[i-1], seq[j-1], scores, omit),
          m[i-1][j] + scores.gap,
          m[i][j-1] + scores.gap
        ];
      m[i][j] = Math.max(...choices);
      switch (choices.indexOf(m[i][j])) {
        case Traceback.FIRST:
          // points to default [0, 0]
          break;
        case Traceback.DIAGONAL:
          t[i][j] = [i-1, j-1];
          break;
        case Traceback.LEFT:
          t[i][j] = [i-1, j];
          break;
        case Traceback.UP:
          t[i][j] = [i, j-1];
          break;
      }
      if (m[i][j] > max) {
        max = m[i][j];
        maxCell = [i, j];
      }
    }
  }

  // construct alignment via traceback
  let insertion = 0;
  let [i, j] = maxCell;
  // begin alginment
  const alignment = {
      coordinates: Array(ref.length-i).fill(null),
      scores: Array(ref.length-i).fill(null)
    };
  while (m[i][j] !== 0) {
    let [i2, j2] = t[i][j];
    if (j2 === j && j !== 0) {
      insertion += 1;
    // (mis)match
    } else if (j2 === j-1 && i2 === i-1) {
      // backfill insertion
      if (insertion > 0) {
        let step = 1/(insertion+1);
        for (let k = insertion-1; k >= 0; k--) {
          const x = j + (k+1)*step;
          alignment.coordinates.unshift(x-1);
          alignment.scores.unshift(m[i+k+1][j]-m[i+k][j]);
        }
        insertion = 0;
      }
      alignment.coordinates.unshift(j-1)
      alignment.scores.unshift(m[i][j]-m[i2][j2]);
    }
    [i, j] = [i2, j2];
  }
  // end alignment
  if (alignment.coordinates.filter((x) => x !== null).length > 2) {
    const fill = Array(ref.length-alignment.coordinates.length).fill(null);
    alignment.coordinates.unshift(...fill);
    alignment.scores.unshift(...fill);
  } else {
    return {
      coordinates: Array(ref.length-i).fill(null),
      scores: Array(ref.length-i).fill(null)
    };
  }

  return alignment;
}


/**
 * The Smith-Waterman algorithm.
 * @param {Array<T>} reference - The sequence to be aligned to.
 * @param {Array<T>} sequence - The sequence to align to the reference.
 * @param {object} options - Optional parameters.
 * @return {Alignment[]} - Local alignments in the form of coordinates
 * describing which element in reference each element in sequence aligned to. In
 * the case of an insertion, the value will be a decimal between the flanking
 * match states. Non-aligned genes get a null coordinate value.
 * Ex: [0, 1, 2, 3, 4, 5]  // a perfect alignment
 *     [0, 0.5, 1, 2, 3, 4]  // an insertion
 *     [0, 0.3, 0.6, 1, 2 ]  // sequential insertions
 *     [0, 1, 2, 5, 6, 7]  // deletions
 *     [null, null, 3, 4, 5, null]  // ends weren't aligned
 */
export function smithWaterman<T>(
  reference: T[],
  sequence: T[],
  options: any={}): Alignment[]
{

  // parse optional parameters
  options = Object.assign({}, options);
  options.scores = Object.assign({}, options.scores);
  setOption(options.scores, "match", 5);
  setOption(options.scores, "mismatch", 0);
  setOption(options.scores, "gap", -1);
  setOption(options.scores, "threshold", 0);
  setOption(options, "omit", new Set());
  setOption(options, "reverse", true);
  setOption(options, "inversions", 2);

  // perform forward and reverse alignments
  const forward = sequence;
  const forwardAlignment =
    align(reference, forward, options.scores, options.omit);
  const reverse = (options.reverse || options.inversions) ?
    [...forward].reverse() : [];
  const reverseAlignment =
    align(reference, reverse, options.scores, options.omit);
  // reverse the reverse alignment
  if (reverseAlignment !== null) {
    reverseAlignment.coordinates.reverse();
    reverseAlignment.scores.reverse();
  }

  // merge alignments
  const alignments = mergeAlignments(
      sequence,
      [forwardAlignment],
      [reverseAlignment],
      options.reversals,
      options.inversions,
      options.scores.threshold)
    .map((a) => {
      return {
        alignment: a.coordinates,
        orientations: a.orientations,
        segments: a.segments,
        score: sum(a.scores),
      };
    });
  return alignments;
}
