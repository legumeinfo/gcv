import { weightedIntervalScheduling } from "./merge-alignments";

// weightedIntervalScheduling(intervals, breakpoint) selects a maximum-weight set
// of NON-OVERLAPPING weighted intervals [begin, end, weight] and returns their
// indices. Intervals with index < breakpoint are "forward"; index >= breakpoint
// are "reverse". A post-traceback swap avoids "gratuitous inversions" — flipping
// a palindrome's orientation on a weight tie for no gain.

type WI = [number, number, number];

/** Inclusive-interval overlap. */
const overlap = (a: WI, b: WI) => !(a[1] < b[0] || b[1] < a[0]);

/** True if any two of the selected intervals overlap. */
const anyOverlap = (chosen: WI[]) =>
  chosen.some((a, x) => chosen.some((b, y) => x < y && overlap(a, b)));

const select = (intervals: WI[], breakpoint: number) =>
  weightedIntervalScheduling(intervals, breakpoint).map((i) => intervals[i]);

describe("weightedIntervalScheduling", () => {

  // ── Layer A: the non-overlap invariant (KNOWN FAILING) ─────────
  //
  // This test asserts the property weighted interval scheduling exists to
  // guarantee — the selected intervals never overlap — and it FAILS ON PURPOSE.
  // It is the open half of issue #1023: the gratuitous-inversion swap (the
  // "edge case where first interval is a gratuitous inversion" block in
  // merge-alignments.ts) substitutes indices[0] for a candidate from a
  // different DP path without checking it is disjoint from indices[1], so the
  // returned set can overlap. The shipped fix only makes downstream code
  // TOLERANT of the overlap (merge-alignments.ts Fix 2); the DP still emits it.
  //
  // Leave this red. When the swap is fixed to preserve the invariant this test
  // turns green on its own — that is the signal the fix is complete.
  it("selects non-overlapping intervals even when the gratuitous-inversion swap fires", () => {
    // The swap fires on this tie and picks overlapping [0,3] and [0,0].
    const chosen = select([[0, 3, 3], [1, 3, 2], [0, 0, 1]], 2);
    expect(anyOverlap(chosen)).toBe(false);
  });

  // ── Layer B: behaviour that must NOT regress if the swap is fixed ─
  //
  // These pin the DP's contract so a future fix to the swap (issue #1023's
  // deferred "Candidate 2") can be made with confidence.

  it("keeps every interval when none overlap", () => {
    const idx = weightedIntervalScheduling([[0, 1, 2], [2, 3, 2], [4, 5, 2]], 3);
    expect([...idx].sort()).toEqual([0, 1, 2]);
  });

  it("chooses the higher-weight interval among overlapping ones", () => {
    // [0,2] (w1) and [1,3] (w5) overlap; the DP keeps only the heavier.
    expect(weightedIntervalScheduling([[0, 2, 1], [1, 3, 5]], 2)).toEqual([1]);
  });

  it("maximizes total weight over a non-overlapping subset", () => {
    // [0,1](w2)+[2,3](w2) = 4 beats the overlapping [0,3](w3) alone.
    const intervals: WI[] = [[0, 1, 2], [0, 3, 3], [2, 3, 2]];
    const idx = weightedIntervalScheduling(intervals, 3);
    expect([...idx].sort()).toEqual([0, 2]);
    const weight = idx.reduce((s, i) => s + intervals[i][2], 0);
    expect(weight).toBe(4);
    expect(anyOverlap(idx.map((i) => intervals[i]))).toBe(false);
  });

  it("avoids a gratuitous inversion on a tie without overlapping", () => {
    // A weight tie where mixing orientations would be gratuitous: the swap
    // keeps both chosen intervals on the same side of the breakpoint (here the
    // reverse side, indices >= 2) AND they remain disjoint — the swap doing its
    // job correctly, in contrast to the Layer A case above.
    const intervals: WI[] = [[2, 4, 2], [3, 5, 2], [0, 1, 1], [4, 4, 2]];
    const breakpoint = 2;
    const idx = weightedIntervalScheduling(intervals, breakpoint);
    expect(anyOverlap(idx.map((i) => intervals[i]))).toBe(false);
    expect(idx.every((i) => i >= breakpoint)).toBe(true);
  });

});
