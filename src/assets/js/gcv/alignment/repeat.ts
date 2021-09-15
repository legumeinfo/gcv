// library
import { matrix, setOption, sum } from "../common";
import { Alignment, InternalAlignment, Scores, Traceback } from "./models";
import { computeScore, mergeAlignments } from "./utils";


/**
 * Given a matrix, a column index, and a threshold, the function returns the
 * value for the first cell for the column and a pointer to the cell in the
 * previous column that the value was derived from.
 * @param {number[][]} m - The score matrix.
 * @param {number} i - The index of the column to compute the first cell for.
 * @param {number} threshold - The threshold to use when computing the first
 * cell.
 * @return {Array<number|Array<number>[2]>[2]} - An array containing the
 * computed value for the first cell of the specified column and an array
 * containing a pointer to the cell in the preceding column that the value was
 * derived from.
 */
function computeFirstCellOfColumn(m: number[][], i: number, threshold: number,
carryover: boolean, matches: Set<number>):
[number, [number, number]] {
  const t = (carryover) ? threshold : 0;
  const values = m[i-1].map((s) => Math.max(0, s-t));
  values[0] = m[i-1][0];
  let v = Math.max(...values);
  let k = values.indexOf(v);
  if (!carryover) {
    v = 0;
    if (!matches.has(k)) {
      k = 0;
    }
  }
  return [v, [i-1, k]];
}


/**
 * Aligns the given sequence to the given reference using the repeat algorithm.
 * Repeat blocks are detected within the reference and alignments are reported
 * as arrays that assign sequence coordinates to elements in the reference.
 * @param {Array<T>} seq - The sequence to be aligned to the reference.
 * @param {Array<T>} ref - The reference to align the sequence to.
 * @param {Scores} scores - An object defining the (mis)match, gap, and
 * threshold values to be used during scoring.
 * @param {Set<T>} omit - A set of elements to be considered unmatchable.
 * @return {InternalAlignment[]} - An array containing an alignment object for
 * each aligned block. Each object has a "coordinates" attribute that is an
 * array describing each reference element's aligned position in the sequence
 * (null if it wasn't aligned) and a "scores" attribute that is an array
 * describing what each element in the reference contributes to the alignment's
 * score (null if the element wasn't aligned).
 * Ex: input: seq: ["A", "B", "C", "D", "E"]
 *            ref: ["A", "B", "A", "B", "F", "G", "H", "C", "D"]
 *            scores: {match: 5, mismath: 0, gap: -1, threshold: 10}
 *     output: [
 *       {
 *         coordinates: [0, 1, null, null, null, null, null, null, null],
 *         scores: [5, 5,  null, null, null, null, null, null, null]
 *       },
 *       {
 *         coordinates: [null, null, 0, 1, 1.25, 1.5, 1.75, 2, 3],
 *         scores: [null, null, 5, 5, -1, -1, -1, 5, 5]
 *       }
 *     ]
 */
function align<T>(
  seq: T[],
  ref: T[],
  scores: Scores,
  omit: Set<T>=new Set,
  carryover: boolean=true): InternalAlignment[]
{

  // construct score and traceback matrices
  const cols = ref.length + 1;  // first item is at index 1
  const rows = seq.length + 1;  // ditto
  const m = matrix(cols, rows, 0);  // scores
  const t = matrix(cols, rows, [0, 0]);  // traceback
  let matches = new Set<number>();
  for (let i = 1; i < cols; i++) {
    // handle unmatched regions and ends of matches
    [m[i][0], t[i][0]] =
      computeFirstCellOfColumn(m, i, scores.threshold, carryover, matches);
    matches = new Set<number>();
    // handle starts of matches and extensions
    for (let j = 1; j < rows; j++) {
      const score = computeScore(ref[i-1], seq[j-1], scores, omit);
      const choices = [
          m[i][0],
          m[i-1][j-1] + score,
          m[i-1][j] + scores.gap,
          m[i][j-1] + scores.gap
        ];
      m[i][j] = Math.max(...choices);
      switch (choices.indexOf(m[i][j])) {
        case Traceback.FIRST:
          t[i][j] = [i, 0];
          break;
        case Traceback.DIAGONAL:
          t[i][j] = [i-1, j-1];
          if (score == scores.match) {
            matches.add(j);
          }
          break;
        case Traceback.LEFT:
          t[i][j] = [i-1, j];
          break;
        case Traceback.UP:
          t[i][j] = [i, j-1];
          break;
      }
    }
  }

  // construct alignments via traceback
  const alignments: InternalAlignment[] = [];
  let a = {coordinates: [], scores: []};
  let insertion = 0;
  let [, [i, j]] =
    computeFirstCellOfColumn(m, cols, scores.threshold, carryover, matches);
  while (!(i === 0 && j === 0)) {
    let [i2, j2] = t[i][j];
    // start new alignment
    if (j2 > j) {
      a = {
          coordinates: Array(ref.length-i2).fill(null),
          scores: Array(ref.length-i2).fill(null)
        };
    // insertion
    } else if (j2 === j && j !== 0) {
      insertion += 1;
    // (mis)match
    } else if (j2 === j-1 && i2 === i-1) {
      // backfill insertion
      if (insertion > 0) {
        let step = 1/(insertion+1);
        for (let k = insertion-1; k >= 0; k--) {
          const x = j + (k+1)*step;
          a.coordinates.unshift(x-1);
          a.scores.unshift(m[i+k+1][j]-m[i+k][j]);
        }
        insertion = 0;
      }
      a.coordinates.unshift(j-1)
      a.scores.unshift(m[i][j]-m[i2][j2]);
    }
    // end alignment
    if (j > 0 && j2 === 0) {
      if (a.coordinates.filter((x) => x !== null).length > 2) {
        const fill = Array(ref.length-a.coordinates.length).fill(null);
        a.coordinates.unshift(...fill);
        a.scores.unshift(...fill);
        alignments.push(a);
      }
      insertion = 0;
    }
    [i, j] = [i2, j2];
  }

  return alignments;
}

/** The Repeat local alignment algorithm by Durbin et al.
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
export function repeat<T>(
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
  setOption(options, "reversals", true);
  setOption(options, "inversions", 2);
  setOption(options, "carryover", true);

  // perform forward and reverse alignments
  const forward = sequence;
  const forwardAlignments =
    align(reference, forward, options.scores, options.omit, options.carryover);
  const reverse = (options.reversals || options.inversions) ?
    [...forward].reverse() : [];
  const reverseAlignments =
    align(reference, reverse, options.scores, options.omit, options.carryover);
  // reverse the reverse alignment orderings and the alignments themselves
  reverseAlignments
    .reverse()
    .forEach(({coordinates, scores}) => {
      coordinates.reverse();
      scores.reverse();
    });

  // merge alignments
  const alignments = mergeAlignments(
      sequence,
      // reverse alignment orders because the dynamic program returns them in
      // backwards order relative to the input sequences
      forwardAlignments.reverse(),
      reverseAlignments.reverse(),
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
