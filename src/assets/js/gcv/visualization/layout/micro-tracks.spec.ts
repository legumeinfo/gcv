import {
  MicroGene,
  MicroTrack,
  columnDomain,
  glyphRotation,
  glyphShape,
  neighborDistances,
  railOffsets,
  trackInterval,
  trackLabel,
  trackLevels,
  trackTicks,
} from './micro-tracks';

const gene = (overrides: Partial<MicroGene>): MicroGene => ({
  name: 'g',
  family: 'f',
  x: 0,
  y: 0,
  fmin: 0,
  fmax: 0,
  strand: 1,
  ...overrides,
});

const track = (genes: Partial<MicroGene>[]): MicroTrack => ({
  chromosome_name: 'Gm01',
  genus: 'Glycine',
  species: 'max',
  genes: genes.map(gene),
});

describe('track rows', () => {
  // the second track has a segment drawn on a second row
  const tracks = [
    track([{ y: 0 }, { y: 0 }]),
    track([{ y: 0 }, { y: 1 }]),
    track([{ y: 0 }]),
  ];

  it('gives each track as many rows as its genes use', () => {
    expect(trackLevels(tracks)).toEqual([1, 2, 1]);
  });

  it('starts each track below the rows of those above it', () => {
    expect(trackTicks(trackLevels(tracks))).toEqual([0, 1, 3]);
  });
});

describe('track labels', () => {
  const t = track([
    { fmin: 500, fmax: 900 },
    { fmin: 100, fmax: 300 },
  ]);

  it("spans the track's drawn genes, whatever their order", () => {
    expect(trackInterval(t)).toEqual([100, 900]);
  });

  it('names the chromosome and the span, after any prefix', () => {
    expect(trackLabel(t)).toBe('Gm01:100-900');
    expect(trackLabel(t, 'G. max - ')).toBe('G. max - Gm01:100-900');
  });
});

describe('neighborDistances', () => {
  it('measures between the nearest ends of consecutive genes', () => {
    const t = track([
      { fmin: 100, fmax: 200 },
      { fmin: 250, fmax: 400 },
      // inverted order: nearest ends are this fmax and the previous fmin
      { fmin: 50, fmax: 240 },
    ]);
    expect(neighborDistances(t)).toEqual([50, 10]);
  });

  it("measures between the genes' right ends too", () => {
    // overlapping genes whose right ends are closest
    const t = track([
      { fmin: 100, fmax: 500 },
      { fmin: 300, fmax: 498 },
    ]);
    expect(neighborDistances(t)).toEqual([2]);
  });
});

describe('columnDomain', () => {
  it('spans every gene of every track, inserted genes included', () => {
    const tracks = [track([{ x: 2 }, { x: 5 }]), track([{ x: 0.5 }])];
    expect(columnDomain(tracks)).toEqual([0.5, 5]);
  });
});

describe('railOffsets', () => {
  it('descends when the right gene is on a lower row', () => {
    expect(railOffsets(gene({ x: 1, y: 0 }), gene({ x: 2, y: 1 }), 30)).toEqual(
      [0, 30],
    );
    // drawn from the left gene, which is b
    expect(railOffsets(gene({ x: 2, y: 0 }), gene({ x: 1, y: 1 }), 30)).toEqual(
      [30, 0],
    );
  });

  it('is flat between genes on one row', () => {
    expect(railOffsets(gene({ x: 1 }), gene({ x: 2 }), 0)).toEqual([0, 0]);
  });
});

describe('glyphs', () => {
  it('points forward genes right and reverse genes left', () => {
    expect(glyphRotation(gene({ strand: 1 }))).toBe(90);
    expect(glyphRotation(gene({ strand: -1 }))).toBe(-90);
  });

  it('flips genes in a reversed track', () => {
    expect(glyphRotation(gene({ strand: 1, reversed: true }))).toBe(-90);
    expect(glyphRotation(gene({ strand: -1, reversed: true }))).toBe(90);
  });

  it('draws a circle for an unknown strand or an omitted family', () => {
    expect(glyphShape(gene({}))).toBe('triangle');
    expect(glyphShape(gene({ strand: undefined }))).toBe('circle');
    expect(glyphShape(gene({ glyph: 'circle' }))).toBe('circle');
  });
});
