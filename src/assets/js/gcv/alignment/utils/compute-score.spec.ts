import { computeScore } from "./compute-score";

describe("computeScore", () => {

  const scores = { match: 5, mismatch: 0 };

  it("returns match score when both elements are equal and not omitted", () => {
    expect(computeScore("A", "A", scores)).toBe(5);
  });

  it("returns mismatch score when elements differ", () => {
    expect(computeScore("A", "B", scores)).toBe(0);
  });

  it("returns mismatch score when equal but element is in omit set", () => {
    const omit = new Set(["A"]);
    expect(computeScore("A", "A", scores, omit)).toBe(0);
  });

  it("works with numeric elements", () => {
    expect(computeScore(1, 1, { match: 10, mismatch: -2 })).toBe(10);
    expect(computeScore(1, 2, { match: 10, mismatch: -2 })).toBe(-2);
  });

  it("handles numeric zero as a valid score", () => {
    const s = { match: 0, mismatch: -5 };
    expect(computeScore("A", "A", s)).toBe(0);
    expect(computeScore("A", "B", s)).toBe(-5);
  });

});
