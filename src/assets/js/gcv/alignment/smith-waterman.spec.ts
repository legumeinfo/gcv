import { smithWaterman } from "./smith-waterman";

describe("smithWaterman", () => {

  const genes = (letters: string): string[] => letters.split("");

  /**
   * Convenience: pure forward Smith-Waterman (no reverse/inversions).
   * `alignment[i]` = position in ref for sequence element `i`, or null.
   */
  const SW = (ref: string[], seq: string[], opts: any = {}) =>
    smithWaterman(ref, seq, { reverse: false, inversions: 0, ...opts });

  // ── Perfect matches ────────────────────────────────────────────

  it("aligns identical sequences to a perfect 1:1 mapping with full score", () => {
    const seq = genes("ABCDE");
    const ref = genes("ABCDE");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    expect(result[0].alignment).toEqual([0, 1, 2, 3, 4]);
    expect(result[0].score).toBe(25);
  });

  it("aligns a sequence that contains an exact match substring of the reference", () => {
    const seq = genes("ABCDEFG");
    const ref = genes("DEFG");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    expect(result[0].alignment).toEqual([null, null, null, 0, 1, 2, 3]);
    expect(result[0].score).toBe(20);
  });

  // ── Mismatches ─────────────────────────────────────────────────

  it("maps mismatch positions to the correct reference index", () => {
    const seq = genes("ABXD");
    const ref = genes("ABCD");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    // X at seq[2] maps to ref[2]=C (mismatched but included in the block)
    expect(result[0].alignment).toEqual([0, 1, 2, 3]);
    expect(result[0].score).toBe(15);      // A(5)+B(5)+X-C mismatch(0)+D(5)
  });

  // ── Insertions ─────────────────────────────────────────────────

  it("reports fractional coordinates for insertions between matched positions", () => {
    const seq = genes("ABXC");
    const ref = genes("ABC");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    const coords = result[0].alignment;
    expect(coords[0]).toBe(0);
    expect(coords[1]).toBe(1);
    // X is an insertion → fractional coordinate between ref positions 1 and 2
    expect(coords[2]).toBeGreaterThan(1);
    expect(coords[2]).toBeLessThan(2);
    expect(coords[3]).toBe(2);
  });

  // ── Deletions ──────────────────────────────────────────────────

  it("handles deletions in the sequence", () => {
    const seq = genes("ABD");
    const ref = genes("ABCD");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    // seq[0]=A→ref[0], seq[1]=B→ref[1], seq[2]=D→ref[3]
    expect(result[0].alignment).toEqual([0, 1, 3]);
    expect(result[0].score).toBe(15);
  });

  // ── Custom scoring ─────────────────────────────────────────────

  it("scales the score by the custom match value", () => {
    const seq = genes("ABCD");
    const ref = genes("ABCD");
    const result = SW(ref, seq, {
      scores: { match: 2, mismatch: -3, gap: -1 },
    });
    expect(result.length).toBe(1);
    expect(result[0].score).toBe(8);      // 4 matches × 2
  });

  it("applies the custom mismatch penalty, altering score and path", () => {
    // ABXDE vs ABCDE: a single interior mismatch (X vs C) flanked by matches.
    const seq = genes("ABXDE");
    const ref = genes("ABCDE");

    // Default mismatch of 0: X aligns straight onto ref[2] for a full 1:1
    // block scoring 5 × 4 matches + 0 = 20.
    const withZeroMismatch = SW(ref, seq);
    expect(withZeroMismatch.length).toBe(1);
    expect(withZeroMismatch[0].alignment).toEqual([0, 1, 2, 3, 4]);
    expect(withZeroMismatch[0].score).toBe(20);

    // A negative mismatch makes eating the X-vs-C penalty more expensive than
    // routing X as an insertion (fractional coord) and skipping C: the score
    // drops and the mismatched position is no longer mapped to integer ref[2].
    const withPenalty = SW(ref, seq, {
      scores: { match: 5, mismatch: -3, gap: -1 },
    });
    expect(withPenalty.length).toBe(1);
    expect(withPenalty[0].score).toBe(19);
    expect(withPenalty[0].alignment[2]).toBeGreaterThan(1);
    expect(withPenalty[0].alignment[2]).toBeLessThan(2);
  });

  // ── Omit set ───────────────────────────────────────────────────

  it("maps omitted elements to the correct position but with zero score contribution", () => {
    const seq = genes("ABCD");
    const ref = genes("ABCD");
    const result = SW(ref, seq, { omit: new Set(["B"]) });
    expect(result.length).toBe(1);
    // B still maps to its position but contributes 0 instead of 5
    expect(result[0].alignment).toEqual([0, 1, 2, 3]);
    expect(result[0].score).toBe(15);      // A(5) + B(0) + C(5) + D(5) = 15
  });

  // ── Threshold ──────────────────────────────────────────────────

  it("keeps an alignment at/above the threshold and filters one below it", () => {
    // ABC/ABC scores 15 and has 3 aligned positions, so it clears the
    // internal minimum-length filter and the threshold is what actually
    // decides its fate (unlike a 2-element sequence, which the length filter
    // drops before the threshold is ever consulted).
    const seq = genes("ABC");
    const ref = genes("ABC");
    const base = { match: 5, mismatch: 0, gap: -1 };

    const kept = SW(ref, seq, { scores: { ...base, threshold: 15 } });
    expect(kept.length).toBe(1);
    expect(kept[0].score).toBe(15);

    const filtered = SW(ref, seq, { scores: { ...base, threshold: 20 } });
    expect(filtered).toEqual([]);
  });

  // ── Inversions / reversals ─────────────────────────────────────
  //
  // Regression: the app invokes smithWaterman with only {omit, scores,
  // carryover} (see clustered-and-aligned-micro-tracks.selector.ts), so the
  // `reverse` and `inversions` options fall back to their defaults (true, 2).
  // A syntenic region that is inverted relative to the query must therefore
  // still be reported, with orientation -1. A prior typo passed the never-set
  // `options.reversals` to mergeAlignments, which silently discarded every
  // reverse-only alignment.

  it("reports a fully inverted region with orientation -1 under production defaults", () => {
    // No options: mirrors how the selector calls the aligner (defaults apply).
    const seq = genes("ABCDE");
    const ref = genes("EDCBA");
    const result = smithWaterman(ref, seq);
    expect(result.length).toBe(1);
    expect(result[0].alignment).toEqual([4, 3, 2, 1, 0]);
    expect(result[0].orientations).toEqual([-1, -1, -1, -1, -1]);
    expect(result[0].score).toBe(25);
  });

  it("keeps a reverse-only alignment when reverse is enabled explicitly", () => {
    const seq = genes("ABCD");
    const ref = genes("DCBA");
    const result = smithWaterman(ref, seq, { reverse: true, inversions: 2 });
    const hasInverse = result.some((a) =>
      a.orientations.some((o) => o === -1)
    );
    expect(hasInverse).toBe(true);
  });

  // ── Output invariants ──────────────────────────────────────────

  it("alignment length equals sequence length for every result", () => {
    const seq = genes("ABEF");
    const ref = genes("ABCDEFGHIJ");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    expect(result[0].alignment.length).toBe(seq.length);
    expect(result[0].orientations.length).toBe(seq.length);
    expect(result[0].segments.length).toBe(seq.length);
  });

  it("orientation values are only null, 1, or -1", () => {
    const seq = genes("ABCDEF");
    const ref = genes("ABCDEF");
    const result = smithWaterman(ref, seq, { reverse: true, inversions: 2 });
    for (const a of result) {
      for (const o of a.orientations) {
        expect(o === null || o === 1 || o === -1).toBe(true);
      }
    }
  });

  // ── Edge cases: inputs producing valid local alignments ────────

  it("aligns a sequence that is a subsequence of a larger reference", () => {
    // Need at least 3 non-null alignment positions to pass the internal filter.
    const seq = genes("CDE");
    const ref = genes("ABCDEF");
    const result = SW(ref, seq);
    expect(result.length).toBe(1);
    expect(result[0].alignment).toEqual([2, 3, 4]);
    expect(result[0].score).toBe(15);
  });

});
