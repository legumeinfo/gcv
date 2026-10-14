import { levenshtein } from './levenshtein';

// levenshtein is GCV's sequence edit distance. The micro-track clustering metric
// (clustered-and-aligned-micro-tracks.selector) uses it over arrays of gene
// FAMILY identifiers to decide which tracks are similar enough to cluster and
// align together. A wrong distance silently reshapes the clusters — tracks that
// belong together drift apart, or unrelated tracks merge — with no crash. These
// tests pin the metric's contract on both characters and family-string arrays.
describe('levenshtein', () => {
  it('is 0 for identical sequences', () => {
    expect(levenshtein(['A', 'B', 'C'], ['A', 'B', 'C'])).toBe(0);
  });

  it('equals the length of the other sequence when one is empty', () => {
    expect(levenshtein([], [])).toBe(0);
    expect(levenshtein([], ['A', 'B', 'C'])).toBe(3);
    expect(levenshtein(['A', 'B'], [])).toBe(2);
  });

  it('counts a single substitution as distance 1', () => {
    expect(levenshtein(['A', 'B', 'C'], ['A', 'X', 'C'])).toBe(1);
  });

  it('counts a single insertion or deletion as distance 1', () => {
    expect(levenshtein(['A', 'B', 'C'], ['A', 'B', 'C', 'D'])).toBe(1); // insert
    expect(levenshtein(['A', 'B', 'C'], ['A', 'C'])).toBe(1); // delete
  });

  it('matches the classic kitten -> sitting distance of 3', () => {
    const kitten = 'kitten'.split('');
    const sitting = 'sitting'.split('');
    expect(levenshtein(kitten, sitting)).toBe(3);
  });

  it('is symmetric', () => {
    const a = ['A', 'B', 'C', 'D'];
    const b = ['A', 'X', 'C', 'Y', 'Z'];
    expect(levenshtein(a, b)).toBe(levenshtein(b, a));
  });

  it('distinguishes similar from divergent family sequences (clustering use)', () => {
    const track = ['fam1', 'fam2', 'fam3'];
    const nearlyIdentical = ['fam1', 'fam2', 'famX']; // one family differs
    const divergent = ['famA', 'famB', 'famC']; // all families differ
    expect(levenshtein(track, nearlyIdentical)).toBeLessThan(
      levenshtein(track, divergent),
    );
  });
});
