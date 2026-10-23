import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { ClusterAlignment, clusterAlignments } from './alignment.report';
import { regionPresence, trackChanges } from './changes.report';
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
  consensus = ['f', 'f', 'f'],
): ClusterAlignment[] {
  const clusters = Array.from(new Set(results.map((t) => t.cluster)));
  const queries = clusters.map((cluster) => ({ ...query, cluster }));
  return clusterAlignments(
    Array(Math.max(...clusters) + 1).fill(consensus),
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
        support: {
          familiesMatched: 1,
          singleCopyFamiliesMatched: 0,
          spanGenes: 2,
          largestGap: 0,
        },
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

describe('regionPresence', () => {
  // single-copy families p, q and r follow the tandem family f
  const at = (label: string, results: AlignedTrack[]) => ({
    label,
    clusters: view(results, new Map(), ['f', 'f', 'p', 'q', 'r']),
  });

  it('follows a region across views, through the genes its tracks share', () => {
    const report = regionPresence(
      [
        at('current', [
          track({ name: 'Chr20', genes: ['a2', 'a3'] }),
          track({ name: 'Chr03', genes: ['c1', 'c2'], score: 20 }),
        ]),
        // a wider window: the Chr20 track grows, another region appears
        at('set1', [
          track({ name: 'Chr20', genes: ['a1', 'a2', 'a3', 'a4'], cluster: 1 }),
          track({
            name: 'NLL-09',
            genus: 'Lupinus',
            species: 'angustifolius',
            genes: ['n1', 'n2', 'n3'],
            families: ['p', 'q', 'r'],
            alignment: [2, 3, 4],
          }),
        ]),
        at('set2', [track({ name: 'Chr20', genes: ['a4', 'a5'] })]),
      ],
      10,
    );
    expect(
      report.regions.map((r) => [
        r.chromosome,
        r.foundIn,
        Object.keys(r.support),
      ]),
    ).toEqual([
      ['Chr20', ['current', 'set1', 'set2'], ['current', 'set1', 'set2']],
      ['NLL-09', ['set1'], ['set1']],
      ['Chr03', ['current'], ['current']],
    ]);
    expect(report.regions[2].support.current).toMatchObject({ score: 20 });
    expect(report.omittedRegions).toBe(0);
  });

  it('keeps the better-supported track of a view, and caps the regions', () => {
    const report = regionPresence(
      [
        at('current', [
          track({ name: 'Chr20', genes: ['a1', 'a2'] }),
          // a second alignment of the same region, with single-copy matches
          track({
            name: 'Chr20',
            genes: ['a2', 'a3'],
            families: ['p', 'q'],
            alignment: [2, 3],
          }),
          track({ name: 'Chr25', genes: ['b1'] }),
        ]),
      ],
      1,
    );
    expect(report.regions).toHaveLength(1);
    expect(report.omittedRegions).toBe(1);
    expect(report.regions[0].support.current.singleCopyFamiliesMatched).toBe(2);
  });
});
