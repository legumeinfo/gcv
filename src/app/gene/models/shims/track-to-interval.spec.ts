import { trackToInterval } from './track-to-interval';

describe('trackToInterval', () => {
  const genesMap = {
    'Glyma.01G000100': { fmin: 100, fmax: 200, name: 'Glyma.01G000100' },
    'Glyma.01G000200': { fmin: 250, fmax: 350, name: 'Glyma.01G000200' },
    'Glyma.01G000300': { fmin: 400, fmax: 500, name: 'Glyma.01G000300' },
  };

  it('computes the genomic span covered by all genes in the track', () => {
    const track = {
      genes: ['Glyma.01G000100', 'Glyma.01G000300'],
      families: ['fam1', 'fam3'],
      name: 'Gm01',
      source: 'lis',
      genus: 'Glycine',
      species: 'max',
      length: 50000000,
    };
    const result = trackToInterval(track as any, genesMap as any);
    expect(result).toEqual({ start: 100, stop: 500 });
  });

  it('silently drops genes not present in genesMap', () => {
    const track = {
      genes: ['Glyma.01G000100', 'MissingGene', 'Glyma.01G000300'],
      families: ['fam1', 'fam2', 'fam3'],
      name: 'Gm01',
      source: 'lis',
      genus: 'Glycine',
      species: 'max',
      length: 50000000,
    };
    const result = trackToInterval(track as any, genesMap as any);
    // MissingGene is filtered; interval uses only the found genes.
    expect(result).toEqual({ start: 100, stop: 500 });
  });

  it('returns {start: 0, stop: 0} when all genes are missing from genesMap', () => {
    const track = {
      genes: ['MissingGene1', 'MissingGene2'],
      families: [],
      name: 'Gm01',
      source: 'lis',
      genus: 'Glycine',
      species: 'max',
      length: 50000000,
    };
    const result = trackToInterval(track as any, genesMap as any);
    expect(result).toEqual({ start: 0, stop: 0 });
  });

  it('returns {start: 0, stop: 0} for an empty gene list', () => {
    const track = {
      genes: [],
      families: [],
      name: 'Gm01',
      source: 'lis',
      genus: 'Glycine',
      species: 'max',
      length: 50000000,
    };
    const result = trackToInterval(track as any, genesMap as any);
    expect(result).toEqual({ start: 0, stop: 0 });
  });

  it('single gene produces span equal to gene fmin..fmax', () => {
    const track = {
      genes: ['Glyma.01G000100'],
      families: ['fam1'],
      name: 'Gm01',
      source: 'lis',
      genus: 'Glycine',
      species: 'max',
      length: 50000000,
    };
    const result = trackToInterval(track as any, genesMap as any);
    expect(result.start).toBe(100);
    expect(result.stop).toBe(200);
  });

  it('handles overlapping genes correctly', () => {
    const overlappingMap = {
      A: { fmin: 100, fmax: 500 },
      B: { fmin: 200, fmax: 300 },
    };
    const track = {
      genes: ['A', 'B'],
      families: [],
      name: 'chr1',
      source: 'lis',
      genus: 'Glycine',
      species: 'max',
      length: 1000000,
    };
    const result = trackToInterval(track as any, overlappingMap as any);
    // B is entirely inside A, so interval is A's span.
    expect(result).toEqual({ start: 100, stop: 500 });
  });
});
