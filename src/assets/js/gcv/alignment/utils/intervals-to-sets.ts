// app
import { Interval } from "../models";
// dependencies
import { StaticDisjointSet } from "mnemonist";


/**
 * Given forward and reverse interval arrays (assumes both are sorted by start
 * position and elements don't overlap), the function creates sets of indices in
 * the forward and reverse interval arrays that correspond to overlapping
 * intervals.
 * @param {Array<[number, number]>} forward - The forward intervals.
 * @param {Array<[number, number]>} reverse - The reverse intervals.
 * @return {Array<Object>} - An array containing an object for each set of
 * overlapping intervals. Each object has a "forward" attribute containing an
 * array of the forward intervals in the set and a "reverse" attribute
 * containing the reverse intervals in the set. The intervals in each array are
 * ordered the same as in the input arrays.
 */
export function intervalsToSets(
  forward: Array<Interval>,
  reverse: Array<Interval>,
  inversions: boolean
): Array<{forward: Array<number>, reverse: Array<number>}> {
  // use a disjoint set and union-find to track interval sets
  const sets = new StaticDisjointSet(forward.length+reverse.length);
  // dovetail iterate intervals to find overlaps
  let f = 0;
  let r = 0;
  while (f < forward.length && r < reverse.length) {
    let [fBegin, fEnd] = forward[f];
    let [rBegin, rEnd] = reverse[r];
    // consider neighboring intervals as overlapping for inversions
    if (inversions) {
      rBegin -= 1;
      rEnd += 1;
    }
    if (fEnd < rBegin) {
      f += 1;
    } else if (rEnd < fBegin) {
      r += 1;
    } else if (rBegin <= fEnd && fEnd <= rEnd) {
      sets.union(f, r+forward.length);
      f += 1;
    } else if (fBegin <= rEnd && rEnd <= fEnd) {
      sets.union(f, r+forward.length);
      r += 1;
    }
  }
  // convert disjoint sets to interval objects
  const reducer = (accumulator, i) => {
      if (i < forward.length) {
        accumulator.forward.push(i);
      } else {
       accumulator.reverse.push(i-forward.length);
      }
      return accumulator;
    };
  const overlaps = sets.compile()
    .map((s) => s.reduce(reducer, {forward: [], reverse: []}));
  return overlaps;
}
