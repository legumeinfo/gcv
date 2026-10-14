import { selectFilteredPairwiseBlocksForTracksAndTargets } from './pairwise-blocks.selector';

// Change C moved the target-chromosome filtering out of PairwiseBlocksService's
// `.pipe(map(...))` and into this selector. These pin the moved filtering logic
// via the selector's projector (a pure function of the upstream blocks).

describe('selectFilteredPairwiseBlocksForTracksAndTargets', () => {
  const blocks = [{ chromosome: 'c1' }, { chromosome: 'c2' }] as any;

  it('keeps only blocks on the requested target chromosomes', () => {
    const selector = selectFilteredPairwiseBlocksForTracksAndTargets(
      [],
      [],
      ['c1'],
    );
    expect(selector.projector(blocks).map((b) => b.chromosome)).toEqual(['c1']);
  });

  it('returns all blocks when no targets are requested', () => {
    const selector = selectFilteredPairwiseBlocksForTracksAndTargets(
      [],
      [],
      [],
    );
    expect(selector.projector(blocks).map((b) => b.chromosome)).toEqual([
      'c1',
      'c2',
    ]);
  });
});
