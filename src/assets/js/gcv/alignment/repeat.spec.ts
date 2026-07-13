import { repeat } from "./repeat";

describe("repeat (Durbin repeat-finding local alignment)", () => {

  const genes = (letters: string): string[] => letters.split("");

  // NB: repeat() reads the `reversals` option (not `reverse`). Passing
  // `reverse` here would be silently ignored, leaving reversals at their
  // default of enabled — so forward-only cases must set `reversals: false`.
  const R = (ref: string[], seq: string[], opts: any = {}) =>
    repeat(ref, seq, { reversals: false, inversions: 0, ...opts });

  // ── Single block ───────────────────────────────────────────────

  it("finds a single exact match block within the reference", () => {
    const seq = genes("ABC");
    const ref = genes("XYZABCGGG");
    const result = R(ref, seq);
    expect(result.length).toBe(1);
    expect(result[0].score).toBe(15);

    // Alignment is sequence-length: seq[i] → ref position (or null).
    // seq[0]=A → ref[3], seq[1]=B → ref[4], seq[2]=C → ref[5]
    expect(result[0].alignment).toEqual([3, 4, 5]);
  });

  // ── Repeated elements ──────────────────────────────────────────

  it("finds blocks across non-contiguous reference regions", () => {
    // Seq "ABCDE" has "AB" at ref[2..3] and "CD" at ref[7..8].
    const seq = genes("ABCDE");
    const ref = genes("ABABFGHCD");
    const result = R(ref, seq);
    // The repeat algorithm maps each seq position to its best match.
    // seq[0]=A→ref[2], seq[1]=B→ref[3], seq[2]=C→ref[7], seq[3]=D→ref[8], seq[4]=E→null
    expect(result.length).toBe(1);
    expect(result[0].alignment).toEqual([2, 3, 7, 8, null]);
    expect(result[0].score).toBe(20);
  });

  // ── No match ───────────────────────────────────────────────────

  it("returns empty array when the sequence has no matching blocks", () => {
    const seq = genes("ABC");
    const ref = genes("DEFGHI");
    const result = R(ref, seq);
    expect(result.length).toBe(0);
  });

  // ── Custom scores ──────────────────────────────────────────────

  it("respects custom match/mismatch/gap scores", () => {
    const seq = genes("ABC");
    const ref = genes("ABC");
    const result = R(ref, seq, {
      scores: { match: 2, mismatch: -3, gap: -1 },
    });
    expect(result.length).toBe(1);
    expect(result[0].score).toBe(6);
  });

  // ── Threshold ───────────────────────────────────────────────────

  it("keeps a block at/above the threshold and filters one below it", () => {
    // ABC/ABC scores 15 with 3 aligned positions, clearing the internal
    // minimum-length filter, so the threshold is the deciding factor. A
    // 2-element sequence would be dropped by the length filter first, making
    // any threshold assertion vacuous.
    const seq = genes("ABC");
    const ref = genes("ABC");
    const base = { match: 5, mismatch: 0, gap: -1 };

    // Unlike Smith-Waterman's post-hoc `sum >= threshold` gate, the repeat DP
    // subtracts the threshold as it carries scores across columns, so a block
    // scoring exactly the threshold is dropped. The score-15 block survives at
    // threshold 14 but not at threshold 15.
    const kept = R(ref, seq, { scores: { ...base, threshold: 14 } });
    expect(kept.length).toBe(1);
    expect(kept[0].score).toBe(15);

    const filtered = R(ref, seq, { scores: { ...base, threshold: 15 } });
    expect(filtered).toEqual([]);
  });

  // ── Omit set ───────────────────────────────────────────────────
  //
  // Note: omit can fragment repeat blocks to below the minimum-size
  // threshold (> 2 non-null coords). Tested in smith-waterman.spec.ts
  // where the single-alignment DP handles it directly.

  // ── Inversions ─────────────────────────────────────────────────

  it("detects inverted blocks when reverse and inversions are enabled", () => {
    const seq = genes("ABC");
    const ref = genes("CBA");
    const result = repeat(ref, seq, { reverse: true, inversions: 2 });
    const hasInverse = result.some((a) =>
      a.orientations.some((o) => o === -1)
    );
    expect(hasInverse).toBe(true);
  });

  // ── Output invariants ──────────────────────────────────────────

  it("alignment length equals sequence length for each block", () => {
    const seq = genes("AB");
    const ref = genes("XABYABZ");
    const result = R(ref, seq);
    for (const a of result) {
      expect(a.alignment.length).toBe(seq.length);
      expect(a.orientations.length).toBe(seq.length);
      expect(a.segments.length).toBe(seq.length);
    }
  });

  it("orientation values are only null, 1, or -1", () => {
    const seq = genes("ABCDEF");
    const ref = genes("ABCDEF");
    const result = repeat(ref, seq, { reverse: true, inversions: 2 });
    for (const a of result) {
      for (const o of a.orientations) {
        expect(o === null || o === 1 || o === -1).toBe(true);
      }
    }
  });

  // ── Edge cases ─────────────────────────────────────────────────

  it("returns empty for an empty sequence", () => {
    const result = R(genes("XYZ"), []);
    expect(result.length).toBe(0);
  });

});
