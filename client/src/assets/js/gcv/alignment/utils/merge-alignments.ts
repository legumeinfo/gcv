import { filterByIndex, sum } from "../../common";
import { InternalAlignment, Interval, MergedInternalAlignment, WeightedInterval }
  from "../models";
import { alignmentInterval } from "./alignment-interval";
import { intervalsToSets } from "./intervals-to-sets";


function combineAlignments(
  alignments: InternalAlignment[],
  intervals: Interval[]): InternalAlignment
{
  const l = alignments[0].coordinates.length;
  const alignment = {
      coordinates: Array(l).fill(null),
      scores: Array(l).fill(null)
    };
  alignments.forEach((a, i) => {
    let [begin, end] = intervals[i];
    const coordinates = a.coordinates.slice(begin, end+1);
    const scores = a.scores.slice(begin, end+1);
    alignment.coordinates.splice(begin, end+1-begin, ...coordinates);
    alignment.scores.splice(begin, end+1-begin, ...scores);
  });
  return alignment;
}


// assumes intervals are non-overlapping and sorted by start position, and if
// there's a gap at least one alignment covers it
function combineAlignmentIntervals(
  alignments: InternalAlignment[],
  intervals: Array<[number, number, number]>): InternalAlignment
{
  const l = alignments[0].coordinates.length;
  const alignment = {
      coordinates: Array(l).fill(null),
      orientations: Array(l).fill(null),
      segments: Array(l).fill(null),
      scores: Array(l).fill(null)
    };
  let segment = 0;
  const spliceAlignment = (begin, end, i) => {
      const coordinates = alignments[i].coordinates.slice(begin, end+1);
      const orientation = (i == 0) ? 1 : -1;
      const orientations = Array(end+1-begin).fill(orientation);
      const segments = Array(end+1-begin).fill(segment++);
      const scores = alignments[i].scores.slice(begin, end+1);
      alignment.coordinates.splice(begin, end+1-begin, ...coordinates);
      alignment.orientations.splice(begin, end+1-begin, ...orientations);
      alignment.segments.splice(begin, end+1-begin, ...segments);
      alignment.scores.splice(begin, end+1-begin, ...scores);
    };
  let gapBegin = intervals[0][0];
  let prevI = -1;
  intervals.forEach(([begin, end, i]) => {
    // fill the gap
    // TODO: can gaps be prevented at cut time?
    if (gapBegin != begin) {
      const gapEnd = begin-1;
      const alignmentGapScores = alignments
        .map((a, j): [(number|null)[], number] => {
          return [a.scores.slice(gapBegin, gapEnd+1), j];
        });
      // if the flanks are from the same alignment, fill from there if possible
      if (prevI == i && alignmentGapScores[i].every((s) => s != null)) {
        spliceAlignment(gapBegin, gapEnd, i);
      // otherwise pick the highest scoring fill
      // TODO: should this consider inversion size?
      } else {
        const alignmentGapWeights = alignmentGapScores
          .filter(([scores, j]) => scores.every((s) => s != null))
          .map(([scores, j]) => [sum(scores), j]);
        const weights = alignmentGapWeights.map(([weight, j]) => weight);
        const indexes = alignmentGapWeights.map(([weight, j]) => j);
        let j = weights.indexOf(Math.max(...weights));
        spliceAlignment(gapBegin, gapEnd, indexes[j]);
      }
    }
    // save the current interval
    spliceAlignment(begin, end, i);
    // prepare for next iteration
    gapBegin = end+1;
    prevI = i;
  });
  return alignment;
}


/**
 * Iterates the alignments simultaneously and marks score breakpoints and
 * sub-alignment endpoints as potential cut points. Assumes each forward
 * alignment does not overlap with another forward alignment but overlaps with
 * at least one reverse alignment, and vice versa for reverse alignments.
 * @param {InternalAlignment} forwardAlignment - The forward alignment.
 * @param {InternalAlignment} reverseAlignment - The reverse alignment.
 * @return{[Array<Array<number>>, Array<Array<number>>]} - Arrays containing
 * groups of potential cut points, one group for every sub-alignment in an
 * alignment.
 */
function potentialCutPoints<T>(
  sequence: T[],
  forwardAlignment: InternalAlignment,
  reverseAlignment: InternalAlignment,
): [Array<Array<number>>, Array<Array<number>>] {

  // the cut points to be output
  const forwardCuts = [];
  const reverseCuts = [];

  // general function for adding cut points to forward/reverse cut arrays
  const addPoint = (p, aBegin, aBreak, aEnd, aCuts, aCut, bNoCut, bCut, duplicate) => {
      if (aBegin || aBreak || aEnd) {
        if (aBegin) {
          aCut = [p];
        } else {
          aCut.push(p);
          if (aEnd) {
            aCuts.push(aCut);
            aCut = null;
          }
        }
        // add the point to bCut if b isn't going to add it
        if (bNoCut && !aBreak && !duplicate) {
          bCut.push(p);
        }
      }
      return aCut;
    };

  // variables used to construct cut points
  const forwardScores = forwardAlignment.scores.concat(null);
  const reverseScores = reverseAlignment.scores.concat(null);
  let fCut = null;
  let rCut = null;
  let prevFscore = null;
  let prevRscore = null;
  const l = forwardScores.length;
  for (let i = 0; i < l; i++) {

    const fScore = forwardScores[i];
    const rScore = reverseScores[i];

    // determine which type of cut points (if any) are being saved
    // only one of fBegin, fEnd, fBreak, and fNoCut will be true at a time,
    // though all can be false; ditto for r
    const duplicate = sequence[i] == sequence[i-1];
    const fBegin = prevFscore == null && fScore != null;
    const rBegin = prevRscore == null && rScore != null;
    const fEnd = prevFscore != null && fScore == null;
    const rEnd = prevRscore != null && rScore == null;
    const fBreak = !fBegin && !fEnd &&
      ((fScore > 0 && prevFscore <= 0) || (fScore <= 0 && prevFscore > 0)) &&
      rScore != null && !duplicate;
    const rBreak = !rBegin && !rEnd &&
      ((rScore > 0 && prevRscore <= 0) || (rScore <= 0 && prevRscore > 0)) &&
      fScore != null && !duplicate;
    const fNull = prevFscore == null && fScore == null;
    const rNull = prevRscore == null && rScore == null;
    const fNoCut = !fBegin && !fEnd && !fBreak && fScore != null;
    const rNoCut = !rBegin && !rEnd && !rBreak && rScore != null;

    fCut = addPoint(i, fBegin, fBreak, fEnd, forwardCuts, fCut, rNoCut, rCut, duplicate);
    rCut = addPoint(i, rBegin, rBreak, rEnd, reverseCuts, rCut, fNoCut, fCut, duplicate);

    prevFscore = fScore;
    prevRscore = rScore;
  }
  return [forwardCuts, reverseCuts];
}


/**
 * Given a set of alignments and corresponding potential cut points, all
 * potential cuts are iterated and those that meet the given size and threshold
 * constrains output as a weighted interval, where the weight is derived from
 * the cut's corresponding alignment scores.
 * @param {InternalAlignment} alignment - The alignment the cut to perform the
 * cuts on.
 * @param {Array<Array<number>>} cutPoints - The potential points to perform
 * cuts at.
 * @param {number} minsize - The minimum number of genes a cut must have.
 * @param {number} threshold - The minimum score a cut must have.
 * @return{Array<WeightedInterval>} - An array of valid cut intervals and their
 * weights.
 */
function cutPointsToWeightedIntervals(
  alignment: InternalAlignment,
  cutPoints: Array<Array<number>>,
  minsize: number,
  threshold: number): Array<WeightedInterval>
{
  const intervals = [];
  // for each sub-alignment
  cutPoints.forEach((points) => {
    // iterate all valid pairs of cut points
    for (let i = 0; i < points.length-1; i++) {
      const begin = points[i];
      for (let j = i+1; j < points.length; j++) {
        const end = points[j];
        const weight = sum(alignment.scores.slice(begin, end));
        // save intervals that meet the minsize and threshold constraints
        if (end-begin+1 >= minsize && weight >= threshold) {
          intervals.push([begin, end-1, weight]);
        }
      }
    }
  });
  return intervals;
}


/**
 * Given a set of weighted intervals, this function uses the weighted interval
 * scheduling dynamic program to find a set of non-overlapping intervals such
 * that the sum of their weights is maximized. The output is an array of indices
 * corresponding to the intervals in the input array that are in the solution.
 * @param {Array<WeightedInterval>} intervals - The weighted intervals to
 * schedule.
 * @return{Array<number>} - The indices of the intervals in the input array that
 * are in the solution.
 */
function weightedIntervalScheduling(
  intervals: WeightedInterval[],
  breakpoint: number=0,
): number[] {
  // augment each interval with its original index and sort by finish position,
  // start position, and weight (palindromes that align the same in both
  // orientations will be next to each other)
  const compare = (a, b) => a[1]-b[1] || a[0]-b[0] || a[2]-b[2];
  const sortedIntervals = intervals
    .map((interval, i) => [...interval, i])
    .sort(compare);
  // initialize the supporting data structures (add 0 to front of w and p to
  // make recurrence more clear)
  // each interval's weight
  const w = [0].concat(sortedIntervals.map(([begin, end, weight, i]) => weight));
  // for each interval, the index of the closest preceding interval it doesn't
  // overlap with
  const p = [0].concat(sortedIntervals.map(([begin, end, weight, i], j) => {
      // TODO: this is worst case n^2; can be done in n log n with binary search
      for (let k = j-1; k >= 0; k--) {
        const [begin2, end2, weight2, i2] = sortedIntervals[k];
        if (end2 < begin) {  // strictly less than because intervals are inclusive
          return k+1;
        }
      }
      return 0;
    }));
  // perform the recurrence
  const m = [0];
  for (let j = 1; j < p.length; j++) {
    m[j] = Math.max(w[j]+m[p[j]], m[j-1]);
  }
  // traceback the solution
  const indices = [];
  let lastI = null;
  for (let j = m.length-1; j > 0;) {
    const pointer = w[j] + m[p[j]];
    const prev = m[j-1];
    const i = sortedIntervals[j-1][3];
    // avoid gratuitous inversions of palindromes in the case of a tie
    if (pointer > prev || (pointer == prev && (lastI == null ||
        ((lastI >= breakpoint && i >= breakpoint) ||
         (lastI < breakpoint && i < breakpoint))))) {
      indices.push(i);
      lastI = i;
      j = p[j];
    } else {
      j = j-1;
    }
  }
  // edge case where first interval is a gratuitous inversion
  if (indices.length > 1) {
    const j = m.length-1;
    const pointer = w[j] + m[p[j]];
    const pointerI = sortedIntervals[j-1][3];
    const prev = m[j-1];
    const prevI = sortedIntervals[j-2][3];
    if (pointer == prev) {
      if (indices[0] == pointerI && (
          (pointerI < breakpoint && indices[1] >= breakpoint) ||
          (pointerI >= breakpoint && indices[1] < breakpoint))) {
        indices[0] = prevI;
      } else if (indices[0] == prevI && (
          (prevI < breakpoint && indices[1] >= breakpoint) ||
          (prevI >= breakpoint && indices[1] < breakpoint))) {
        indices[0] = pointerI;
      }
    }
  }
  return indices;
}


/**
 * Takes forward and reverse alignments and their corresponding intervals and
 * computes a single alignment with a maximized score that meets the given
 * minsize and threshold constraints. It is assumed that forward and reverse
 * intervals don't overlap with themselves but each forward interval overlaps
 * with at least one reverse interval and vice versa.
 * @param {Array<InternalAlignment>} forwardAlignments - The forward alignments.
 * @param {Array<Interval>} forwardIntervals - The forward alignment intervals.
 * @param {Array<InternalAlignment>} reverseAlignments - The reverse alignments.
 * @param {Array<Interval>} reverseIntervals - The reverse alignment intervals.
 * @param {number} minsize - The minimum size of a forward/reverse segment in
 * the computed alignment.
 * @param {number} threshold - The minimum score a segment must have in the
 * computed alignment.
 * @return{Array<InternalAlignment>} - The merged alignments.
 */
function reversalsAndInversions<T>(
  sequence: T[],
  forwardAlignments: InternalAlignment[],
  forwardIntervals: Interval[],
  reverseAlignments: InternalAlignment[],
  reverseIntervals: Interval[],
  minsize: number,
  threshold: number): InternalAlignment
{
  // combine each orientation's alignments and scores
  const flatForward = combineAlignments(forwardAlignments, forwardIntervals);
  const flatReverse = combineAlignments(reverseAlignments, reverseIntervals);

  // identify potential cut points
  const [forwardCutPoints, reverseCutPoints] =
    potentialCutPoints(sequence, flatForward, flatReverse);

  // convert potential cut points into valid weighted intervals
  const weightedForwardIntervals =
    cutPointsToWeightedIntervals(flatForward, forwardCutPoints, minsize, threshold);
  const weightedReverseIntervals =
    cutPointsToWeightedIntervals(flatReverse, reverseCutPoints, minsize, threshold);

  // use weighted interval scheduling dynamic program to find a set of cut
  // intervals that generates the highest scoring alignment
  const breakpoint = weightedForwardIntervals.length;
  const weightedIntervals =
    weightedForwardIntervals.concat(weightedReverseIntervals);
  const optimalIntervals = weightedIntervalScheduling(weightedIntervals, breakpoint);
  const compare = (a, b) => a[0]-b[0] || a[1]-b[1] || a[2]-b[2];
  const alignmentIndexedOptimalIntervals = optimalIntervals
    .map((i): [number, number, number] => {
      if (i < breakpoint) {
        const [begin, end, weight] = weightedForwardIntervals[i];
        return [begin, end, 0];
      }
      i = i-breakpoint;
      const [begin, end, weight] = weightedReverseIntervals[i];
      return [begin, end, 1];
    })
    .sort(compare);
  const alignments = [flatForward, flatReverse];
  const alignment =
    combineAlignmentIntervals(alignments, alignmentIndexedOptimalIntervals);

  return alignment;
}


function reversalsOnly<T>(
  sequence: T[],
  forwardAlignments: InternalAlignment[],
  forwardIntervals: Interval[],
  reverseAlignments: InternalAlignment[],
  reverseIntervals: Interval[],
  minsize: number,
  threshold: number): InternalAlignment
{
  // TODO: implement w/ weighted interval scheduling dynamic program
  return reversalsAndInversions(
    sequence,
    forwardAlignments,
    forwardIntervals,
    reverseAlignments,
    reverseIntervals,
    minsize,
    threshold);
}


function inversionsOnly<T>(
  sequence: T[],
  forwardAlignments: InternalAlignment[],
  forwardIntervals: Interval[],
  reverseAlignments: InternalAlignment[],
  reverseIntervals: Interval[],
  minsize: number,
  threshold: number): InternalAlignment
{
  // TODO: implement
  return reversalsAndInversions(
    sequence,
    forwardAlignments,
    forwardIntervals,
    reverseAlignments,
    reverseIntervals,
    minsize,
    threshold);
}


/**
 * Given a set of forward and reverse alignment segments for the same sequence
 * and reference, the function merges overlapping segments in a manner dictated
 * by whether or not reversals or inversions are allowed. Note, it is assumed
 * that the alignment segments are sorted by start position.
 * @param {Array<InternalAlignment>} forwardAlignments - The forward alignments.
 * @param {Array<InternalAlignment>} reverseAlignments - The reverse alignments.
 * @param {boolean} reversals - Whether or not reversals are allowed.
 * @param {number} inversions - Minimum size an inversion must be, i.e. 0 means
 * inversions are not allowed.
 * @param {number} threshold - The minimum score a segment must have in the
 * computed alignment
 * @return{Array<InternalAlignment>} - The merged alignments.
 */
export function mergeAlignments<T>(
  sequence: T[],
  forwardAlignments: InternalAlignment[],
  reverseAlignments: InternalAlignment[],
  reversals: boolean,
  inversions: number,
  threshold: number): MergedInternalAlignment[]
{

  // filter alignments by size and score
  const alignmentFilter = (a) => {
      const scores = a.scores.filter((s) => s != null);
      return scores.length >= inversions && sum(scores) >= threshold;
    };
  const filteredForwardAlignments = forwardAlignments.filter(alignmentFilter);
  const filteredReverseAlignments = reverseAlignments.filter(alignmentFilter);

  // make a sequence coordinate interval for each alignment
  const alignmentToInterval = (a) => alignmentInterval(a.coordinates);
  const forwardIntervals = filteredForwardAlignments.map(alignmentToInterval);
  const reverseIntervals = filteredReverseAlignments.map(alignmentToInterval);

  // find sets of overlapping intervals
  const overlaps =
    intervalsToSets(forwardIntervals, reverseIntervals, inversions>0);

  // convert each set of overlapping intervals into an alignment
  const alignments = [];
  overlaps.forEach(({forward, reverse}) => {
    const overlapForwardAlignments =
      filterByIndex(filteredForwardAlignments, forward);
    const overlapForwardIntervals = filterByIndex(forwardIntervals, forward);
    const overlapReverseAlignments =
      filterByIndex(filteredReverseAlignments, reverse);
    const overlapReverseIntervals = filterByIndex(reverseIntervals, reverse);
    // just save the forward alignments
    if (forward.length !== 0 && (reverse.length === 0 ||
        (!reversals && !inversions))) {
      const segmentAlignments = overlapForwardAlignments.map((a, i) => {
          const [begin, end] = overlapForwardIntervals[i];
          const orientations = Array(a.coordinates.length).fill(null);
          orientations.splice(begin, end+1, ...Array(end+1-begin).fill(1));
          const segments = Array(a.coordinates.length).fill(null);
          segments.splice(begin, end+1, ...Array(end+1-begin).fill(i));
          return {...a, orientations, segments};
        });
      alignments.push(...segmentAlignments);
    // just save the reverse alignments
    } else if (forward.length === 0 && reverse.length !== 0) {
      if (reversals) {
        const segmentAlignments = overlapReverseAlignments.map((a, i) => {
            const [begin, end] = overlapReverseIntervals[i];
            const orientations = Array(a.coordinates.length).fill(null);
            orientations.splice(begin, end+1, ...Array(end+1-begin).fill(-1));
            const segments = Array(a.coordinates.length).fill(null);
            segments.splice(begin, end+1, ...Array(end+1-begin).fill(i));
            return {...a, orientations, segments};
          });
        alignments.push(...segmentAlignments);
      }
    // create alignment from overlapping segments
    } else {
      const args: [T[], InternalAlignment[], Interval[], InternalAlignment[],
      Interval[], number, number] =
        [sequence, overlapForwardAlignments, overlapForwardIntervals,
        overlapReverseAlignments, overlapReverseIntervals, inversions, threshold];
      let alignment;
      // combine all alignments such that the score is maximized
      if (reversals && inversions) {
        alignment = reversalsAndInversions(...args);
      // keep a set of non-overlapping alignments with maximized score
      } else if (reversals && !inversions) {
        alignment = reversalsOnly(...args);
      // only sub-intervals of forward segments can be inverted
      } else if (!reversals && inversions) {
        alignment = inversionsOnly(...args);
      }
      // else handled by "just save the forward alignments"
      alignments.push(alignment);
    }
  });

  return alignments;
}
