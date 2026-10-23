import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { ClusterAlignment, clusterAlignments } from './alignment.report';
import { trackChanges } from './changes.report';
import { AlignedTrack } from './view-state';

function track(
  overrides: Partial<AlignedTrack> & Pick<AlignedTrack, 'name' | 'genes'>,
): AlignedTrack {
  const n = overrides.genes.length;
  return {
    length: 0,
    genus: 'Lupinus',
    species: 'albus',
    source: 'lis',
    cluster: 0,
    families: Array(n).fill('f'),
    alignment: [...Array(n).keys()],
    orientations: Array(n).fill(1),
    segments: Array(n).fill(0),
    score: 30,
    ...overrides,
  };
}

const query = track({ name: 'Gm15', genes: ['q1', 'q2', 'q3'] });

// the view's alignments, with the query track first in each cluster
function view(
  results: AlignedTrack[],
  genes = new Map<string, Gene>(),
): ClusterAlignment[] {
  const queries = Array.from(new Set(results.map((t) => t.cluster))).map(
    (cluster) => ({ ...query, cluster }),
  );
  return clusterAlignments(
    [['f', 'f', 'f']],
    [...queries, ...results],
    new Set(queries),
    genes,
  );
}

describe('trackChanges', () => {
  it('keeps a region whose neighborhood grew, even in another cluster', () => {
    const before = view([track({ name: 'Chr20', genes: ['a2', 'a3'] })]);
    const after = view([
      track({ name: 'Chr20', genes: ['a1', 'a2', 'a3', 'a4'], cluster: 1 }),
    ]);
    expect(trackChanges(before, after, 10)).toEqual({
      before: 1,
      after: 1,
      kept: 1,
      added: [],
      removed: [],
      omittedAdded: 0,
      omittedRemoved: 0,
    });
  });

  it('reports regions found or lost, with their support', () => {
    const genes = new Map<string, Gene>([
      [
        geneID('c1', 'lis'),
        {
          name: 'c1',
          family: 'f',
          fmin: 4_110_000,
          fmax: 4_112_000,
          strand: 1,
          chromosome: 'Chr03',
          source: 'lis',
        },
      ],
    ]);
    const before = view([
      track({ name: 'Chr20', genes: ['a1', 'a2'] }),
      track({ name: 'Chr25', genes: ['b1', 'b2'] }),
    ]);
    const after = view(
      [
        track({ name: 'Chr20', genes: ['a1', 'a2'] }),
        // another region of a chromosome already in the view
        track({ name: 'Chr25', genes: ['b7', 'b8'], score: 21 }),
        track({ name: 'Chr03', genes: ['c1', 'cx'], segments: [0, 1] }),
      ],
      genes,
    );
    const changes = trackChanges(before, after, 10);
    expect(changes).toMatchObject({ before: 2, after: 3, kept: 1 });
    expect(changes.added).toEqual([
      {
        cluster: 0,
        source: 'lis',
        genus: 'Lupinus',
        species: 'albus',
        chromosome: 'Chr25',
        score: 21,
        familyMatches: 2,
        segments: 1,
      },
      expect.objectContaining({
        chromosome: 'Chr03',
        fmin: 4_110_000,
        fmax: 4_112_000,
        segments: 2,
      }),
    ]);
    expect(changes.removed.map((t) => t.chromosome)).toEqual(['Chr25']);
  });

  it('ignores query tracks', () => {
    const before = view([track({ name: 'Chr20', genes: ['a1'] })]);
    const after = view([
      track({ name: 'Chr20', genes: ['a1'], cluster: 1 }),
      track({ name: 'Chr21', genes: ['d1'], cluster: 2 }),
    ]);
    const changes = trackChanges(before, after, 10);
    expect(changes).toMatchObject({ before: 1, after: 2, kept: 1 });
    expect(changes.added.map((t) => t.chromosome)).toEqual(['Chr21']);
  });

  it('reports at most maxTracks of each, saying how many it left out', () => {
    const before = view(
      ['r1', 'r2', 'r3'].map((name) => track({ name, genes: [name] })),
    );
    const after = view(
      ['n1', 'n2', 'n3', 'n4'].map((name) => track({ name, genes: [name] })),
    );
    const changes = trackChanges(before, after, 2);
    expect(changes.added.map((t) => t.chromosome)).toEqual(['n1', 'n2']);
    expect(changes.removed.map((t) => t.chromosome)).toEqual(['r1', 'r2']);
    expect(changes).toMatchObject({
      kept: 0,
      omittedAdded: 2,
      omittedRemoved: 1,
    });
  });
});
