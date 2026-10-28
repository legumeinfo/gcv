import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { AlignedTrack, clusterAlignments } from './alignment';

function track(
  overrides: Partial<AlignedTrack> & Pick<AlignedTrack, 'name' | 'genes'>,
): AlignedTrack {
  const n = overrides.genes.length;
  return {
    length: 0,
    genus: 'Glycine',
    species: 'max',
    source: 'lis',
    cluster: 0,
    families: Array(n).fill('f'),
    alignment: [...Array(n).keys()],
    orientations: Array(n).fill(1),
    segments: Array(n).fill(0),
    score: 0,
    ...overrides,
  };
}

// consensus f1 f2 f3; the result aligns inverted, with an extra gene that
// doesn't align
const consensus = ['f1', 'f2', 'f3'];
const query = track({
  name: 'Gm01',
  genes: ['q1', 'q2', 'q3'],
  families: ['f1', 'f2', 'f3'],
});
const result = track({
  name: 'Pv01',
  genus: 'Phaseolus',
  species: 'vulgaris',
  genes: ['r1', 'r2', 'rx', 'r3'],
  families: ['f3', 'f2', 'fx', 'f9'],
  alignment: [2, 1, null, 0],
  orientations: [-1, -1, null, -1],
  segments: [0, 0, null, 0],
  score: 30,
});
const genes = new Map<string, Gene>([
  [
    geneID('q2', 'lis'),
    {
      name: 'q2',
      family: 'f2',
      fmin: 100,
      fmax: 200,
      strand: 1,
      chromosome: 'Gm01',
      source: 'lis',
    },
  ],
  [
    geneID('r2', 'lis'),
    {
      name: 'r2',
      family: 'f2',
      fmin: 5000,
      fmax: 5300,
      strand: -1,
      chromosome: 'Pv01',
      source: 'lis',
    },
  ],
]);

describe('clusterAlignments', () => {
  const [cluster] = clusterAlignments(
    [consensus],
    [query, result],
    new Set([query]),
    genes,
  );

  it('labels query and result tracks and keeps their order', () => {
    expect(cluster.tracks.map((t) => [t.role, t.chromosome])).toEqual([
      ['query', 'Gm01'],
      ['result', 'Pv01'],
    ]);
  });

  it('reports each gene with its column, orientation and position', () => {
    const r = cluster.tracks[1];
    expect(r.genes.map((g) => [g.name, g.column, g.orientation])).toEqual([
      ['r1', 2, '-'],
      ['r2', 1, '-'],
      ['rx', null, null],
      ['r3', 0, '-'],
    ]);
    expect(r.genes[1]).toMatchObject({ strand: -1, fmin: 5000, fmax: 5300 });
    expect(r.genes[0].fmin).toBeUndefined();
  });

  it('summarizes the alignment against the consensus families', () => {
    expect(cluster.tracks[1].summary).toEqual({
      genes: 4,
      aligned: 3,
      inserted: 0,
      familyMatches: 2, // r1=f3 at c2 and r2=f2 at c1; r3=f9 at c0 mismatches
      inverted: 3,
      segments: 1,
      consensusCoverage: 1,
      support: {
        familiesMatched: 2,
        singleCopyFamiliesMatched: 2,
        spanGenes: 2,
        largestGap: 0,
      },
    });
    expect(cluster.tracks[1].score).toBe(30);
    expect(cluster.tracks[0].score).toBeNull();
  });

  it("spans a track's located genes", () => {
    expect(cluster.tracks[1]).toMatchObject({ fmin: 5000, fmax: 5300 });
  });
});

describe("a track's support", () => {
  // t is a tandem pair in the consensus; the track matches a, t twice and b,
  // with three unmatched genes between t and b
  const tandem = track({
    name: 'Lu03',
    genes: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6'],
    families: ['a', 't', 'x', 'x', 'x', 'b', 't'],
    alignment: [0, 1, null, null, null, 3, 2],
  });
  const [cluster] = clusterAlignments(
    [['a', 't', 't', 'b', 'c']],
    [query, tandem],
    new Set([query]),
    new Map(),
  );

  it('counts distinct families, and those with one copy, apart', () => {
    expect(cluster.tracks[1].summary.familyMatches).toBe(4);
    expect(cluster.tracks[1].summary.support).toEqual({
      familiesMatched: 3,
      singleCopyFamiliesMatched: 2,
      spanGenes: 7,
      largestGap: 3,
    });
  });
});

describe('inserted genes', () => {
  // ri sits between consensus columns 0 and 1, as the aligners place it
  const inserted = track({
    name: 'Va01',
    genes: ['v1', 'ri', 'v2'],
    families: ['f1', 'fi', 'f2'],
    alignment: [0, 0.5, 1],
  });
  const clusters = clusterAlignments(
    [consensus],
    [query, inserted],
    new Set([query]),
    new Map(),
  );

  it('reports the column an inserted gene follows instead of a column', () => {
    const genes = clusters[0].tracks[1].genes;
    expect(genes[1]).toMatchObject({
      name: 'ri',
      column: null,
      insertedAfter: 0,
      orientation: '+',
    });
    expect(clusters[0].tracks[1].summary).toMatchObject({
      aligned: 2,
      inserted: 1,
    });
  });
});
