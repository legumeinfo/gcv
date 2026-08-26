import { intervalsToSets } from './intervals-to-sets';

describe('intervalsToSets', () => {
  const f = (forward, reverse, inversions = false) =>
    intervalsToSets(forward, reverse, inversions);

  it('returns separate sets when forward and reverse intervals do not overlap', () => {
    const forward: [number, number][] = [[0, 2]];
    const reverse: [number, number][] = [[5, 7]];
    const result = f(forward, reverse);

    expect(result).toEqual([
      { forward: [0], reverse: [] },
      { forward: [], reverse: [0] },
    ]);
  });

  it('unions forward and reverse intervals when they overlap', () => {
    const forward: [number, number][] = [[0, 5]];
    const reverse: [number, number][] = [[3, 7]];
    const result = f(forward, reverse);

    expect(result).toEqual([{ forward: [0], reverse: [0] }]);
  });

  it('chains multiple intervals that transitively overlap', () => {
    const forward: [number, number][] = [
      [0, 5],
      [10, 15],
    ];
    const reverse: [number, number][] = [[3, 12]];
    const result = f(forward, reverse);

    expect(result).toEqual([{ forward: [0, 1], reverse: [0] }]);
  });

  it('expands reverse interval bounds by 1 on each side when inversions=true', () => {
    const forward: [number, number][] = [[3, 7]];
    const reverse: [number, number][] = [[0, 2]]; // [0,2] becomes [-1,3] with inversions
    const result = f(forward, reverse, true);

    expect(result).toEqual([{ forward: [0], reverse: [0] }]);
  });

  it('does not overlap touching intervals when inversions=false', () => {
    const forward: [number, number][] = [[0, 2]];
    const reverse: [number, number][] = [[3, 5]];
    const result = f(forward, reverse, false);

    expect(result).toEqual([
      { forward: [0], reverse: [] },
      { forward: [], reverse: [0] },
    ]);
  });

  it('overlaps adjacent intervals when inversions=true', () => {
    const forward: [number, number][] = [[0, 2]];
    const reverse: [number, number][] = [[3, 5]]; // becomes [2,6] with inversions
    const result = f(forward, reverse, true);

    expect(result).toEqual([{ forward: [0], reverse: [0] }]);
  });

  it('handles empty forward array', () => {
    const forward: [number, number][] = [];
    const reverse: [number, number][] = [[5, 7]];
    const result = f(forward, reverse);

    expect(result).toEqual([{ forward: [], reverse: [0] }]);
  });

  it('handles empty reverse array', () => {
    const forward: [number, number][] = [[0, 2]];
    const reverse: [number, number][] = [];
    const result = f(forward, reverse);

    expect(result).toEqual([{ forward: [0], reverse: [] }]);
  });

  it('handles both arrays empty', () => {
    const forward: [number, number][] = [];
    const reverse: [number, number][] = [];
    const result = f(forward, reverse);

    expect(result).toEqual([]);
  });

  it('unions a reverse interval fully contained within a forward interval', () => {
    // This is the canonical inversion shape: a reversed segment nested inside
    // a larger forward-aligned block. The dovetail scan must still union them.
    const forward: [number, number][] = [[0, 10]];
    const reverse: [number, number][] = [[3, 5]];
    const result = f(forward, reverse);

    expect(result).toEqual([{ forward: [0], reverse: [0] }]);
  });

  it('unions a forward interval fully contained within a reverse interval', () => {
    const forward: [number, number][] = [[3, 5]];
    const reverse: [number, number][] = [[0, 10]];
    const result = f(forward, reverse);

    expect(result).toEqual([{ forward: [0], reverse: [0] }]);
  });

  it('handles multiple independent overlapping clusters', () => {
    const forward: [number, number][] = [
      [0, 5],
      [50, 55],
    ];
    const reverse: [number, number][] = [
      [2, 7],
      [48, 53],
    ];
    const result = f(forward, reverse);

    expect(result).toEqual([
      { forward: [0], reverse: [0] },
      { forward: [1], reverse: [1] },
    ]);
  });
});
