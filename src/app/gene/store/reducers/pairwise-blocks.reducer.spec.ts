import {
  pairwiseBlocksID,
  singleID,
  idArrayLeftDifference,
} from './pairwise-blocks.reducer';

describe('pairwise-blocks.reducer — ID factory', () => {
  it('formats name:source', () => {
    expect(singleID('Gm01', 'lis')).toBe('Gm01:lis');
  });

  it('produces ref:refSrc:chr:chrSrc with all 4 positional args', () => {
    expect(pairwiseBlocksID('lis', 'Gm01', 'lis', 'Gm15')).toBe(
      'Gm01:lis:Gm15:lis',
    );
  });

  it('substitutes * when chromosome is omitted', () => {
    expect(pairwiseBlocksID('lis', 'Gm01', 'lis')).toBe('Gm01:lis:*:lis');
  });

  it('object overload matches positional for equivalent inputs', () => {
    const pos = pairwiseBlocksID('lis', 'Gm01', 'lis', 'Gm15');
    const obj = pairwiseBlocksID({
      referenceSource: 'lis',
      reference: 'Gm01',
      chromosomeSource: 'lis',
      chromosome: 'Gm15',
    });
    expect(pos).toBe(obj);
  });

  it('defaults chromosome to * when absent from the object', () => {
    expect(
      pairwiseBlocksID({
        referenceSource: 'lis',
        reference: 'Gm01',
        chromosomeSource: 'lis',
      }),
    ).toBe('Gm01:lis:*:lis');
  });

  it('produces keys that split cleanly into 4 colon-separated parts', () => {
    // The getSelectedPairwiseBlocks selector splits entity keys on ':'.
    // A colon in any component would misalign the split.
    const id = pairwiseBlocksID('lis', 'Gm01', 'lis', 'Gm15');
    const parts = id.split(':');
    expect(parts.length).toBe(4);
  });
});

describe('pairwise-blocks.reducer — wildcard idArrayLeftDifference', () => {
  // Helper: create a PairwiseBlocksID-like object
  const id = (ref: string, refSrc: string, chrSrc: string, chr?: string) =>
    chr !== undefined
      ? {
          reference: ref,
          referenceSource: refSrc,
          chromosomeSource: chrSrc,
          chromosome: chr,
        }
      : { reference: ref, referenceSource: refSrc, chromosomeSource: chrSrc };

  it('wildcard in loaded blocks a wildcard request', () => {
    const loaded = [id('Gm01', 'lis', 'lis')]; // chr = *
    const requested = [id('Gm01', 'lis', 'lis')]; // chr = *
    const result = idArrayLeftDifference(requested, loaded);
    expect(result).toEqual([]);
  });

  it('wildcard in loaded blocks a specific-chromosome request', () => {
    const loaded = [id('Gm01', 'lis', 'lis')]; // chr = *
    const requested = [id('Gm01', 'lis', 'lis', 'Gm15')]; // chr = Gm15
    const result = idArrayLeftDifference(requested, loaded);
    expect(result).toEqual([]);
  });

  it('specific-chromosome in loaded blocks only that chromosome', () => {
    const loaded = [id('Gm01', 'lis', 'lis', 'Gm15')];
    const requested = [id('Gm01', 'lis', 'lis', 'Gm15')];
    const result = idArrayLeftDifference(requested, loaded);
    expect(result).toEqual([]);
  });

  it('specific-chromosome in loaded does NOT block a different chromosome', () => {
    const loaded = [id('Gm01', 'lis', 'lis', 'Gm15')];
    const requested = [id('Gm01', 'lis', 'lis', 'Gm01')];
    const result = idArrayLeftDifference(requested, loaded);
    expect(result.length).toBe(1);
    expect(result[0].chromosome).toBe('Gm01');
  });

  it('specific-chromosome in loaded does NOT block a wildcard request', () => {
    // A wildcard query asks for ALL chromosomes; a single specific-chromosome
    // load only pre-loaded one of them. The wildcard should still proceed.
    const loaded = [id('Gm01', 'lis', 'lis', 'Gm15')];
    const requested = [id('Gm01', 'lis', 'lis')]; // wildcard
    const result = idArrayLeftDifference(requested, loaded);
    expect(result.length).toBe(1);
  });

  it('different referenceSource is never blocked', () => {
    const loaded = [id('Gm01', 'lis', 'lis')];
    const requested = [id('Gm01', 'gcv', 'lis')];
    const result = idArrayLeftDifference(requested, loaded);
    expect(result.length).toBe(1);
  });

  it('different reference is never blocked', () => {
    const loaded = [id('Gm01', 'lis', 'lis')];
    const requested = [id('Gm02', 'lis', 'lis')];
    const result = idArrayLeftDifference(requested, loaded);
    expect(result.length).toBe(1);
  });

  it('handles mixed loaded array correctly', () => {
    const loaded = [
      id('Gm01', 'lis', 'lis', 'Gm15'), // specific
      id('Gm02', 'lis', 'lis'), // wildcard
    ];
    const requested = [
      id('Gm01', 'lis', 'lis', 'Gm15'), // blocked by exact match
      id('Gm01', 'lis', 'lis', 'Gm01'), // NOT blocked (diff chr)
      id('Gm02', 'lis', 'lis', 'Gm01'), // blocked by wildcard (*)
    ];
    const result = idArrayLeftDifference(requested, loaded);
    expect(result.length).toBe(1);
    expect(result[0].chromosome).toBe('Gm01');
  });

  it('empty loaded passes all requests through', () => {
    const requested = [
      id('Gm01', 'lis', 'lis'),
      id('Gm01', 'lis', 'lis', 'Gm15'),
    ];
    const result = idArrayLeftDifference(requested, []);
    expect(result).toEqual(requested);
  });

  it('checkAction=true includes action ID in the key', () => {
    const loaded = [
      {
        ...id('Gm01', 'lis', 'lis'),
        action: 'act-1',
      },
    ];
    const requested = [
      {
        ...id('Gm01', 'lis', 'lis'),
        action: 'act-2', // different action → not blocked
      },
    ];
    const result = idArrayLeftDifference(requested, loaded, true);
    expect(result.length).toBe(1);
  });

  it('checkAction=true blocks only when action IDs match', () => {
    const loaded = [
      {
        ...id('Gm01', 'lis', 'lis'),
        action: 'act-1',
      },
    ];
    const requested = [
      {
        ...id('Gm01', 'lis', 'lis'),
        action: 'act-1', // same action → blocked
      },
    ];
    const result = idArrayLeftDifference(requested, loaded, true);
    expect(result).toEqual([]);
  });
});
