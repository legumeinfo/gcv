import { alignmentInterval } from "./alignment-interval";

describe("alignmentInterval", () => {

  it("returns full range when alignment has no nulls", () => {
    const a = [0, 1, 2, 3, 4];
    expect(alignmentInterval(a)).toEqual([0, 4]);
  });

  it("skips leading nulls", () => {
    const a = [null, null, 2, 3, 4];
    expect(alignmentInterval(a)).toEqual([2, 4]);
  });

  it("skips trailing nulls", () => {
    const a = [0, 1, 2, null, null];
    expect(alignmentInterval(a)).toEqual([0, 2]);
  });

  it("skips both leading and trailing nulls", () => {
    const a = [null, null, 2, 3, null, null];
    expect(alignmentInterval(a)).toEqual([2, 3]);
  });

  it("handles middle nulls (they are included in the interval)", () => {
    const a = [0, null, 2, null, 4];
    expect(alignmentInterval(a)).toEqual([0, 4]);
  });

  it("returns [0, length-1] for single non-null element", () => {
    const a = [null, null, 7, null, null];
    expect(alignmentInterval(a)).toEqual([2, 2]);
  });

  it("handles all-null array (returns [length, -1])", () => {
    const a = [null, null, null];
    expect(alignmentInterval(a)).toEqual([3, -1]);
  });

  it("handles empty array", () => {
    const a: number[] = [];
    expect(alignmentInterval(a)).toEqual([0, -1]);
  });

});
