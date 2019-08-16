import { filterByIndex, sum } from "../../common";
import { InternalAlignment, Interval } from "../models";
import { alignmentInterval } from "./alignment-interval";
import { intervalsToSets } from "./intervals-to-sets";


function combineAlignments(
  alignments: InternalAlignment[],
  intervals: Interval[],
  indexes: number[]): InternalAlignment
{
  const l = alignments[0].coordinates.length;
  const alignment = {
      coordinates: Array(l).fill(null),
      scores: Array(l).fill(null)
    };
  indexes.forEach((i) => {
    let [begin, end] = intervals[i];
    const coordinates = alignments[i].coordinates.slice(begin, end+1);
    const scores = alignments[i].scores.slice(begin, end+1);
    alignment.coordinates.splice(begin, end+1-begin, ...coordinates);
    alignment.scores.splice(begin, end+1-begin, ...scores);
  });
  return alignment;
}


function reversalsAndInversions(
  flatForward: InternalAlignment,
  flatReverse: InternalAlignment): InternalAlignment
{
  const resolveOverlap = (begin, end) => {
      const fScores = flatForward.scores.slice(begin, end);
      const rScores = flatReverse.scores.slice(begin, end);
      // add the inversion
      if (sum(fScores) < sum(rScores)) {
        const rCoordinates = flatReverse.coordinates.slice(begin, end);
        return [rCoordinates, rScores];
      }
      // add the forward orientation
      const fCoordinates = flatForward.coordinates.slice(begin, end);
      return [fCoordinates, fScores];
    };
  // iterate flattened alignments simultaneously and resolves inversions
  const coordinates = [];
  const scores = [];
  let overlap = 0;
  for (let i = 0; i < flatForward.coordinates.length; i++) {
    const fCoordinate = flatForward.coordinates[i];
    const rCoordinate = flatReverse.coordinates[i];
    if (fCoordinate === null || rCoordinate === null) {
      // back add overlap
      if (overlap > 0) {
        let [c, s] = resolveOverlap(i-overlap, i);
        coordinates.push(...c);
        scores.push(...s);
        overlap = 0;
      }
      // add forward
      if (fCoordinate !== null) {
        coordinates.push(fCoordinate);
        scores.push(flatForward.scores[i]);
      // add reverse
      } else if (rCoordinate !== null) {
        coordinates.push(rCoordinate);
        scores.push(flatReverse.scores[i]);
      } else {
        coordinates.push(null);
        scores.push(null);
      }
    } else {
      overlap += 1;
    }
  }
  // back add overlap
  if (overlap > 0) {
    let [c, s] = resolveOverlap(-overlap, undefined);
    coordinates.push(...c);
    scores.push(...s);
  }
  return {coordinates, scores};
}


function reversalsOnly(
  flatForward: InternalAlignment,
  flatReverse: InternalAlignment): InternalAlignment
{
  // TODO: implement w/ weighted interval scheduling dynamic program
  return reversalsAndInversions(flatForward, flatReverse);
}


function inversionsOnly(
  flatForward: InternalAlignment,
  flatReverse: InternalAlignment): InternalAlignment
{
  // TODO: implement
  return reversalsAndInversions(flatForward, flatReverse);
}


/**
 * Given a set of forward and reverse alignment segments for the same sequence
 * and reference, the function merges overlapping segments in a manner dictated
 * by whether or not reversals or inversions are allowed.
 * @param {Array<InternalAlignment>} forwardAlignments - The forward alignments.
 * @param {Array<InternalAlignment>} reverseAlignments - The reverse alignments.
 * @param {boolean} reversals - Whether or not reversals are allowed.
 * @param {boolean} inversions - Whether or not inversions are allowed.
 * @return{Array<InternalAlignment>} - The merged alignments.
 */
export function mergeAlignments(
  forwardAlignments: InternalAlignment[],
  reverseAlignments: InternalAlignment[],
  reversals: boolean,
  inversions: boolean): InternalAlignment[]
{

  // make a sequence coordinate interval for each alignment
  const forwardIntervals = forwardAlignments.map((a): Interval => {
      return alignmentInterval(a.coordinates);
    });
  const reverseIntervals = reverseAlignments.map((a): Interval => {
      return alignmentInterval(a.coordinates);
    });

  // find sets of overlapping intervals
  const overlaps =
    intervalsToSets(forwardIntervals, reverseIntervals, inversions);

  // convert the sets of overlapping intervals into alignments
  const alignments = [];
  overlaps.forEach(({forward, reverse}) => {
    // just save the forward alignments
    if (forward.length !== 0 && (reverse.length === 0 ||
        (!reversals && !inversions))) {
      alignments.push(...filterByIndex(forwardAlignments, forward));
    // just save the reverse alignments
    } else if (forward.length === 0 && reverse.length !== 0) {
      if (reversals) {
        alignments.push(...filterByIndex(reverseAlignments, reverse));
      }
    } else {
      // combine each orientation's alignments and scores
      const flatForward =
        combineAlignments(forwardAlignments, forwardIntervals, forward);
      const flatReverse =
        combineAlignments(reverseAlignments, reverseIntervals, reverse);
      let alignment;
      // combine all alignments such that the score is maximized
      if (reversals && inversions) {
        alignment = reversalsAndInversions(flatForward, flatReverse);
      // keep a set of non-overlapping alignments with maximized score
      } else if (reversals && !inversions) {
        alignment = reversalsOnly(flatForward, flatReverse);
      // only sub-intervals of forward segments can be inverted
      } else if (!reversals && inversions) {
        alignment = inversionsOnly(flatForward, flatReverse);
      }
      // else handled by "just save the forward alignments"
      alignments.push(alignment);
    }
  });

  return alignments;
}
