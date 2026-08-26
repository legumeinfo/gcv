import { blockIndexMap } from './block-index-map';

describe('blockIndexMap', () => {
  it('bins block gene indices by reference:referenceSource', () => {
    const pairwiseBlocks = [
      {
        reference: 'Gm01',
        referenceSource: 'lis',
        chromosome: 'Gm15',
        chromosomeSource: 'lis',
        blocks: [{ i: 0, j: 2, orientation: 1, fmin: 100, fmax: 300 }],
      },
    ];

    const result = blockIndexMap(pairwiseBlocks as any);
    // Keyed by reference:referenceSource ("Gm01:lis"), NOT the target
    // `chromosome` field ("Gm15") — blockIndexMap bins by the reference
    // chromosome (see referenceBlockMap, same keying).
    const key = 'Gm01:lis';
    expect(result[key]).toEqual([0, 2]);
  });

  it('concatenates indices from multiple blocks for the same reference', () => {
    const pairwiseBlocks = [
      {
        reference: 'Gm01',
        referenceSource: 'lis',
        chromosome: 'Gm15',
        chromosomeSource: 'lis',
        blocks: [
          { i: 0, j: 1, orientation: 1, fmin: 100, fmax: 200 },
          { i: 3, j: 5, orientation: 1, fmin: 300, fmax: 500 },
        ],
      },
    ];

    const result = blockIndexMap(pairwiseBlocks as any);
    const key = 'Gm01:lis';
    // Both blocks' i,j values are concatenated.
    expect(result[key]).toEqual([0, 1, 3, 5]);
  });

  it('separates indices by reference name', () => {
    const pairwiseBlocks = [
      {
        reference: 'Gm01',
        referenceSource: 'lis',
        chromosome: 'Gm15',
        chromosomeSource: 'lis',
        blocks: [{ i: 0, j: 1, orientation: 1, fmin: 100, fmax: 200 }],
      },
      {
        reference: 'Gm02',
        referenceSource: 'lis',
        chromosome: 'Gm15',
        chromosomeSource: 'lis',
        blocks: [{ i: 5, j: 7, orientation: 1, fmin: 500, fmax: 700 }],
      },
    ];

    const result = blockIndexMap(pairwiseBlocks as any);
    expect(result['Gm01:lis']).toEqual([0, 1]);
    expect(result['Gm02:lis']).toEqual([5, 7]);
  });

  it('separates indices by referenceSource, even for the same reference name', () => {
    const pairwiseBlocks = [
      {
        reference: 'Gm01',
        referenceSource: 'lis',
        chromosome: 'Gm15',
        chromosomeSource: 'lis',
        blocks: [{ i: 0, j: 1, orientation: 1, fmin: 100, fmax: 200 }],
      },
      {
        reference: 'Gm01',
        referenceSource: 'gcv',
        chromosome: 'Gm15',
        chromosomeSource: 'gcv',
        blocks: [{ i: 10, j: 11, orientation: 1, fmin: 1000, fmax: 1100 }],
      },
    ];

    const result = blockIndexMap(pairwiseBlocks as any);
    expect(result['Gm01:lis']).toEqual([0, 1]);
    expect(result['Gm01:gcv']).toEqual([10, 11]);
  });

  it('returns an empty object for empty input', () => {
    const result = blockIndexMap([]);
    expect(result).toEqual({});
  });
});
