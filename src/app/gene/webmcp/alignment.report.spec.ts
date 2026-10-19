import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import {
  clusterAlignmentTsv,
  clusterAlignments,
  syntenicCounterparts,
} from './alignment.report';
import { AlignedTrack } from './view-state';

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
    });
    expect(cluster.tracks[1].score).toBe(30);
    expect(cluster.tracks[0].score).toBeNull();
  });

  it("spans a track's located genes", () => {
    expect(cluster.tracks[1]).toMatchObject({ fmin: 5000, fmax: 5300 });
  });
});

describe('clusterAlignmentTsv', () => {
  it('writes a consensus row and a column per consensus position', () => {
    const [cluster] = clusterAlignments(
      [consensus],
      [query, result],
      new Set([query]),
      new Map(),
    );
    const rows = clusterAlignmentTsv(cluster)
      .split('\n')
      .map((r) => r.split('\t'));
    expect(rows[0].slice(-3)).toEqual(['c0', 'c1', 'c2']);
    expect(rows[1].slice(-3)).toEqual(consensus);
    expect(rows[2].slice(-3)).toEqual(['q1', 'q2', 'q3']);
    expect(rows[3].slice(-3)).toEqual(['r3 (-)', 'r2 (-)', 'r1 (-)']);
  });

  it('keeps self-aligned genes when the consensus is empty', () => {
    const [cluster] = clusterAlignments(
      [[]],
      [query],
      new Set([query]),
      new Map(),
    );
    const rows = clusterAlignmentTsv(cluster).split('\n');
    expect(rows[2].split('\t').slice(-3)).toEqual(['q1', 'q2', 'q3']);
  });
});

describe('syntenicCounterparts', () => {
  const clusters = clusterAlignments(
    [consensus],
    [query, result],
    new Set([query]),
    genes,
  );

  it('returns the genes aligned to the same column in other tracks', () => {
    const [occurrence] = syntenicCounterparts(clusters, 'q2');
    expect(occurrence).toMatchObject({
      role: 'query',
      column: 1,
      consensusFamily: 'f2',
    });
    expect(occurrence.counterparts).toEqual([
      expect.objectContaining({
        gene: 'r2',
        species: 'vulgaris',
        sameFamily: true,
        relativeOrientation: 'opposite',
        fmin: 5000,
      }),
    ]);
  });

  it('flags a counterpart from a different family', () => {
    const [occurrence] = syntenicCounterparts(clusters, 'q1');
    expect(occurrence.counterparts[0]).toMatchObject({
      gene: 'r3',
      sameFamily: false,
    });
  });

  it('reports an unaligned gene without counterparts', () => {
    const [occurrence] = syntenicCounterparts(clusters, 'rx');
    expect(occurrence).toMatchObject({ column: null, consensusFamily: null });
    expect(occurrence.counterparts).toEqual([]);
  });

  it('restricts occurrences to the given source', () => {
    expect(syntenicCounterparts(clusters, 'q2', 'other')).toEqual([]);
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

  it('writes an inserted gene after the gene it follows in the TSV', () => {
    const row = clusterAlignmentTsv(clusters[0]).split('\n')[3].split('\t');
    expect(row.slice(-3)).toEqual(['v1;+ri', 'v2', '']);
  });

  it('gives an inserted gene no counterparts', () => {
    const [occurrence] = syntenicCounterparts(clusters, 'ri');
    expect(occurrence).toMatchObject({ column: null, insertedAfter: 0 });
    expect(occurrence.counterparts).toEqual([]);
    const [q1] = syntenicCounterparts(clusters, 'q1');
    expect(q1.counterparts.map((c) => c.gene)).toEqual(['v1']);
  });
});
