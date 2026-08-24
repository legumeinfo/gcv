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

describe("weightedIntervalScheduling", () => {

  // These pin the DP's contract: a maximum-weight, non-overlapping selection,
  // with the gratuitous-inversion swap keeping orientation consistent on ties.

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
