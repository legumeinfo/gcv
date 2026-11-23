import { PlacedGene, positionToColumn } from './position';

// Positions on a track come from the genes around them, so a site or a QTL
// end drawn on a track sits where the genome puts it among those genes.
describe('positionToColumn', () => {
  // genes of 100 bp, 1 kb apart, in columns 0, 1 and 2
  const forward: PlacedGene[] = [
    { fmin: 1000, fmax: 1100, x: 0 },
    { fmin: 2000, fmax: 2100, x: 1 },
    { fmin: 3000, fmax: 3100, x: 2 },
  ];

  it("places a position inside a gene at the gene's column", () => {
    expect(positionToColumn(forward, 2050)).toEqual({ x: 1 });
    expect(positionToColumn(forward, 1000)).toEqual({ x: 0 });
  });

  it('places a position between genes in proportion', () => {
    expect(positionToColumn(forward, 1550)).toEqual({ x: 0.5 });
    expect(positionToColumn(forward, 2325)).toEqual({ x: 1.25 });
  });

  it('clips a position beyond the genes to the end gene, pointing outward', () => {
    expect(positionToColumn(forward, 10)).toEqual({ x: 0, clipped: 'left' });
    expect(positionToColumn(forward, 9000)).toEqual({ x: 2, clipped: 'right' });
  });

  it('follows an inverted track, where columns fall as positions rise', () => {
    const inverted = forward.map((g, i) => ({ ...g, x: 2 - i }));
    expect(positionToColumn(inverted, 1550)).toEqual({ x: 1.5 });
    expect(positionToColumn(inverted, 10)).toEqual({ x: 2, clipped: 'right' });
  });

  it('works beside an inserted gene and in any gene order', () => {
    const inserted = [
      forward[2],
      { fmin: 1500, fmax: 1600, x: 0.5 },
      ...forward.slice(0, 2),
    ];
    expect(positionToColumn(inserted, 1550)).toEqual({ x: 0.5 });
    expect(positionToColumn(inserted, 1800)).toEqual({ x: 0.75 });
  });

  it('ignores genes without coordinates', () => {
    expect(positionToColumn([{ fmin: 0, fmax: 0, x: 0 }], 5)).toBeUndefined();
    expect(
      positionToColumn([{ fmin: 0, fmax: 0, x: 5 }, ...forward], 2050),
    ).toEqual({ x: 1 });
  });
});
