import { mergeAlignments, combineAlignmentIntervals } from "./merge-alignments";
import { InternalAlignment } from "../models";

// combineAlignmentIntervals stitches the optimal forward/reverse cut intervals
// into one alignment, filling gaps between them. Issue #424: when a gap falls
// on positions where BOTH orientations are null (repeat/tandem-rich regions),
// neither can fill it, and the fill picked an undefined alignment index —
// crashing with "Cannot read properties of undefined (reading 'coordinates')".
// The fix leaves such a gap unaligned (null). This is the reduced form of the
// inputs captured live from the issue's query gene (glyma…Glyma.18G052800).
describe("combineAlignmentIntervals — unfillable gaps (issue #424)", () => {

  // Two segments [0,0] (forward) and [3,4] (reverse) with a gap at [1,2] where
  // the forward alignment is null at 1 and the reverse is null at 2, so no
  // single alignment spans the gap.
  const alignments: InternalAlignment[] = [
    { coordinates: [0, null, 2, 3, 4], scores: [10, null, 10, 10, 10] },
    { coordinates: [0, 1, null, 3, 4], scores: [10, 10, null, 10, 10] },
  ];
  const intervals: [number, number, number][] = [[0, 0, 0], [3, 4, 1]];

  it("does not crash when neither alignment can fill a gap", () => {
    expect(() => combineAlignmentIntervals(alignments, intervals)).not.toThrow();
  });

  it("leaves the unfillable gap unaligned and splices the flanking segments", () => {
    const result = combineAlignmentIntervals(alignments, intervals);
    // gap [1,2] stays null; the forward and reverse segments are placed.
    expect(result.coordinates).toEqual([0, null, null, 3, 4]);
    expect(result.orientations).toEqual([1, null, null, -1, -1]);
    expect(result.segments).toEqual([0, null, null, 1, 1]);
    expect(result.scores).toEqual([10, null, null, 10, 10]);
  });

});

describe("mergeAlignments", () => {

  /**
   * Builds a minimal InternalAlignment from a coordinate array.
   * Non-null coordinates get a match score (default 5), nulls get score 0.
   */
  const ia = (coords: (number | null)[], score = 5): InternalAlignment => ({
    coordinates: coords,
    scores: coords.map((c) => (c !== null ? score : 0)),
  });

  // ── Forward-only: no reversals or inversions ───────────────────

  it("returns a single forward alignment with orientation 1 and a segment", () => {
    const forward = [ia([0, 1, 2])];
    const reverse: InternalAlignment[] = [];
    const result = mergeAlignments(["A", "B", "C"], forward, reverse, false, 0, 0);
    expect(result.length).toBe(1);
    expect(result[0].orientations).toEqual([1, 1, 1]);
    expect(result[0].segments).toEqual([0, 0, 0]);
    expect(result[0].coordinates).toEqual([0, 1, 2]);
  });

  it("returns multiple separate forward alignments that do not overlap", () => {
    const fwd1 = ia([0, 1, null, null, null, null, null]);
    const fwd2 = ia([null, null, null, null, null, 2, 3]);
    const forward = [fwd1, fwd2];
    const reverse: InternalAlignment[] = [];
    const seq = Array(7).fill("X");

    const result = mergeAlignments(seq, forward, reverse, false, 0, 0);
    expect(result.length).toBe(2);
  });

  // ── Score threshold filtering ──────────────────────────────────

  it("filters out alignments whose total score is below the threshold", () => {
    const low = ia([0]);             // score = 5
    const high = ia([0, 1, 2, 3]);   // score = 20
    const forward = [low, high];
    const reverse: InternalAlignment[] = [];
    const seq = ["A"];

    const result = mergeAlignments(seq, forward, reverse, false, 0, 10);
    expect(result.length).toBe(1);
  });

  // ── Reversals (non-overlapping forward + reverse segments) ─────

  it("preserves reverse alignments with orientation -1 when reversals are enabled", () => {
    const fwd: InternalAlignment[] = [];
    const rev = [ia([0, 1, 2])];
    const result = mergeAlignments(["A", "B", "C"], fwd, rev, true, 0, 0);
    expect(result.length).toBe(1);
    expect(result[0].orientations).toEqual([-1, -1, -1]);
  });

  it("discards reverse alignments when reversals are disabled", () => {
    const fwd: InternalAlignment[] = [];
    const rev = [ia([0, 1, 2])];
    const result = mergeAlignments(["A", "B", "C"], fwd, rev, false, 0, 0);
    expect(result.length).toBe(0);
  });

  // ── Both empty ─────────────────────────────────────────────────

  it("returns empty when both forward and reverse are empty", () => {
    const result = mergeAlignments(["A"], [], [], false, 0, 0);
    expect(result.length).toBe(0);
  });

  // ── Size filtering (inversions parameter) ──────────────────────

  it("filters out alignments shorter than the inversion size parameter", () => {
    const small = ia([0, 1]);             // length 2
    const large = ia([0, 1, 2, 3, 4]);    // length 5
    const forward = [small, large];
    const reverse: InternalAlignment[] = [];
    const seq = Array(5).fill("X");

    const result = mergeAlignments(seq, forward, reverse, false, 3, 0);
    expect(result.length).toBe(1);
    expect(result[0].coordinates.filter((c) => c !== null).length)
      .toBeGreaterThanOrEqual(3);
  });

  // ── Output invariants ──────────────────────────────────────────

  it("outputs coordinate, orientation, segment, and score arrays of equal length", () => {
    const fwd = [ia([0, 1, null, null, null])];
    const rev: InternalAlignment[] = [];
    const seq = Array(5).fill("X");

    const result = mergeAlignments(seq, fwd, rev, false, 0, 0);
    expect(result.length).toBe(1);
    const a = result[0];
    expect(a.coordinates.length).toBe(5);
    expect(a.orientations.length).toBe(5);
    expect(a.segments.length).toBe(5);
    expect(a.scores.length).toBe(5);
  });

  it("orientations are only null, 1, or -1", () => {
    const fwd = [ia([0, 1, null, 2])];
    const rev = [ia([null, null, 1, null])];
    const seq = ["A", "B", "C", "D"];

    const result = mergeAlignments(seq, fwd, rev, true, 2, 0);
    for (const a of result) {
      for (const o of a.orientations) {
        expect(o === null || o === 1 || o === -1).toBe(true);
      }
    }
  });

  it("segment indices are sequential integers starting from 0 per result", () => {
    const fwd1 = ia([0, 1, null, null]);
    const fwd2 = ia([null, null, 2, 3]);
    const forward = [fwd1, fwd2];
    const rev: InternalAlignment[] = [];
    const seq = Array(4).fill("X");

    const result = mergeAlignments(seq, forward, rev, false, 0, 0);
    expect(result.length).toBe(2);
    expect(result[0].segments.every((s) => s === null || s === 0)).toBe(true);
    expect(result[1].segments.every((s) => s === null || s === 0)).toBe(true);
  });

  // ── Palindrome edge cases (weightedIntervalScheduling) ──────────
  //
  // These guard the tie-breaking and post-traceback swap logic in
  // weightedIntervalScheduling against regressions in inversion detection
  // for palindromic sequences.

  it("detects the inversion when forward and reverse have equal-scoring overlapping intervals", () => {
    // Two forward and two reverse intervals, all overlapping, equal weight —
    // the palindrome shape that triggers issue #1023's gratuitous-inversion
    // swap. The engine must resolve the tie without throwing (guarded by the
    // shipped fixes) AND still report the inversion: the leading merged block
    // spans the whole palindrome in reverse orientation.
    //
    // This is a golden pin of the current, user-correct behaviour ("the beloved
    // inversion is back"). If the deferred swap fix (issue #1023 Candidate 2)
    // reshapes this output, this test fires — re-baseline it against the new,
    // verified-correct alignment rather than deleting the coverage.
    const fwd1 = ia([0, 1, 2, null, null, null], 5);
    const fwd2 = ia([null, null, null, 3, null, null], 5);
    const rev1 = ia([0, 1, 2, 3, null, null], 5);
    const rev2 = ia([null, null, null, 3, null, null], 5);
    const seq = ["A", "B", "C", "D", "E", "F"];

    const result = mergeAlignments(seq, [fwd1, fwd2], [rev1, rev2], true, 2, 0);

    expect(result.length).toBeGreaterThan(0);
    const inversion = result[0];
    expect(inversion.coordinates).toEqual([0, 1, 2, 3, null, null]);
    expect(inversion.orientations).toEqual([-1, -1, -1, -1, null, null]);
    expect(inversion.segments).toEqual([0, 0, 0, 0, null, null]);
  });

  it("maximizes total score when choosing among overlapping forward and reverse intervals", () => {
    // Forward: f1=[0..1] (score=10), f2=[3..4] (score=10).
    // Reverse: r1=[1..3] (score=15).
    // f2 and r1 overlap at position 3. The optimal choice is f1+r1 (25)
    // rather than f1+f2 (20).
    const fwd1 = ia([0, 1, null, null, null], 5);
    const fwd2 = ia([null, null, null, 2, 3], 5);
    const rev1 = ia([null, 0, 1, 2, null], 5);
    const seq = ["A", "B", "C", "D", "E"];

    const result = mergeAlignments(seq, [fwd1, fwd2], [rev1], true, 2, 0);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Verify fwd1 (positions 0-1) and rev1 (positions 1-3) are both included,
    // and fwd2 (positions 3-4, overlapping rev1) is dropped.
    // Expected: fwd1 contributes 2 non-null positions, rev1 contributes 3 = 5 total.
    const totalMapped = result.reduce(
      (sum, a) => sum + a.coordinates.filter((c) => c !== null).length,
      0,
    );
    // fwd1 + rev1 = 5 non-null positions. fwd1 + fwd2 = 4. The optimal picks fwd1+rev1.
    expect(totalMapped).toBe(5);
  });

  it("avoids gratuitous flips when a palindrome causes identical forward/reverse orientations", () => {
    // Perfectly overlapping forward and reverse intervals of identical content.
    // The algorithm should not alternate between 1 and -1 unnecessarily.
    const aln = ia([0, 1, 2, 3, 4, 5]);
    const seq = ["A", "B", "C", "D", "E", "F"];

    const result = mergeAlignments(seq, [aln], [aln], true, 2, 0);
    expect(result.length).toBe(1);
    // Orientation should not flip back and forth inside a single merged block.
    let lastOrientation: number | null = null;
    let flips = 0;
    for (const o of result[0].orientations) {
      if (o !== null && o !== lastOrientation && lastOrientation !== null) {
        flips++;
      }
      if (o !== null) lastOrientation = o;
    }
    expect(flips).toBe(0);
  });

  it("copes with three-way overlap where forwards outnumber reverses", () => {
    // Three forward intervals, one reverse — all overlapping.
    const fwd1 = ia([0, 1, null, null, null]);
    const fwd2 = ia([null, 1, 2, null, null]);
    const fwd3 = ia([null, null, 2, 3, 4]);
    const rev  = ia([0, 1, 2, null, null]);
    const seq = ["A", "B", "C", "D", "E"];

    const result = mergeAlignments(seq, [fwd1, fwd2, fwd3], [rev], true, 2, 0);
    // Invariant: total score should not exceed maximum possible.
    // No crash is the primary assertion.
    for (const a of result) {
      expect(a.coordinates.length).toBe(seq.length);
    }
  });

});
