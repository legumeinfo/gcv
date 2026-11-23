import { AlignedTrack, clusterAlignments } from '@gcv/gene/alignment';
import { microShim } from '@gcv/gene/components/viewers/micro/micro.shim';
import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { parseAnnotations } from './grammar';
import { AnnotatedCluster, resolveAnnotations } from './resolve';

// Two clusters, built as the viewer builds them. Cluster 0: a soybean query
// q1..q5 in columns 0..4; a common bean track missing column 2, with p9
// inserted after column 3; and a cowpea track aligned inverted. Cluster 1:
// a second query gene and its one match.
function track(
  name: string,
  genes: string[],
  families: string[],
  overrides: Partial<AlignedTrack> = {},
): AlignedTrack {
  return {
    name,
    genus: 'Glycine',
    species: 'max',
    source: 'lis',
    length: 0,
    cluster: 0,
    genes,
    families,
    alignment: genes.map((_, i) => i),
    orientations: genes.map(() => 1),
    segments: genes.map(() => 0),
    score: 30,
    ...overrides,
  };
}

const query = track(
  'glyma.Wm82.gnm2.Gm19',
  ['q1', 'q2', 'q3', 'q4', 'q5'].map((g) => `glyma.Wm82.gnm2.ann1.Glyma.${g}`),
  ['a', 'b', 'c', 'd', 'e'],
);
const bean = track(
  'Pv01',
  ['p1', 'p2', 'p4', 'p9', 'p5'],
  ['a', 'b', 'd', 'x', 'e'],
  {
    alignment: [0, 1, 3, 3.5, 4],
  },
);
const cowpea = track('Vu01', ['v5', 'v4', 'v3'], ['e', 'd', 'c'], {
  alignment: [4, 3, 2],
  orientations: [-1, -1, -1],
});
const query2 = track('glyma.Wm82.gnm2.Gm03', ['r1', 'r2'], ['m', 'n'], {
  cluster: 1,
});
const match2 = track('Pv02', ['s1', 'q1'], ['m', 'n'], { cluster: 1 });
const all = [query, bean, cowpea, query2, match2];

// q1..q5 at 1,000..5,100 on Gm19; other genes without coordinates
const genes: Gene[] = query.genes.map((name, i) => ({
  name,
  family: query.families[i],
  fmin: 1000 * (i + 1),
  fmax: 1000 * (i + 1) + 100,
  strand: 1,
  chromosome: query.name,
  source: 'lis',
}));

function clusters(): AnnotatedCluster[] {
  const geneMap = new Map(genes.map((g) => [geneID(g.name, g.source), g]));
  return [0, 1].map((cluster) => {
    const tracks = all.filter((t) => t.cluster === cluster);
    const queries = tracks.filter((t) => t === query || t === query2);
    const [alignment] = clusterAlignments(
      [
        ['a', 'b', 'c', 'd', 'e'],
        ['m', 'n'],
      ],
      tracks,
      new Set(queries),
      geneMap,
    );
    return {
      alignment,
      drawn: microShim(cluster, queries, all, genes, []).data,
    };
  });
}

const resolve = (annot: string) =>
  resolveAnnotations(parseAnnotations(annot).annotations, clusters());

describe('resolveAnnotations', () => {
  it('boxes the columns between two genes, over every track by default', () => {
    const { placed, unplaced } = resolve('box(c=Glyma.q4~Glyma.q2,x=block)');
    expect(unplaced).toEqual([]);
    expect(placed).toEqual([
      expect.objectContaining({
        cluster: 0,
        kind: 'box',
        columns: [1, 3],
        tracks: [0, 1, 2],
        text: 'block',
      }),
    ]);
  });

  it('boxes the query tracks, or the tracks of the genes named', () => {
    expect(resolve('box(c=Glyma.q1~Glyma.q2,t=q)').placed[0].tracks).toEqual([
      0,
    ]);
    expect(
      resolve('box(c=Glyma.q1~Glyma.q2,t=v4+p1)').placed[0].tracks,
    ).toEqual([2, 1]);
  });

  it('marks a gap in a track, and refuses one where the track has a gene', () => {
    expect(resolve('gap(c=Glyma.q3,t=p1)').placed[0]).toMatchObject({
      kind: 'gap',
      column: 2,
      track: 1,
    });
    expect(resolve('gap(c=Glyma.q4,t=p1)').unplaced[0].reason).toBe(
      "p1's track has p4 in that column, so it has no gap there.",
    );
  });

  it('notes a gene, an inserted one included, or a slot', () => {
    expect(resolve('note(g=p9,x=here)').placed[0]).toMatchObject({
      x: 3.5,
      track: 1,
      text: 'here',
    });
    expect(resolve('note(c=Glyma.q3,t=p2,x=slot)').placed[0]).toMatchObject({
      column: 2,
      track: 1,
    });
  });

  it('heads one column or a span', () => {
    expect(resolve('head(c=Glyma.q2,x=Dt1)').placed[0].columns).toEqual([1, 1]);
    expect(resolve('head(c=v3~Glyma.q1,x=span)').placed[0].columns).toEqual([
      0, 2,
    ]);
  });

  it('places a site on its own chromosome only, through the genes around it', () => {
    const { placed } = resolve('site(at=glyma.Wm82.gnm2.Gm19:2550-3050,x=QTL)');
    expect(placed).toEqual([
      expect.objectContaining({
        cluster: 0,
        kind: 'site',
        sites: [{ track: 0, x0: 1.5, x1: 2 }],
      }),
    ]);
    expect(
      resolve('site(at=glyma.Wm82.gnm4.Gm19:2550)').unplaced[0].reason,
    ).toMatch(
      /^No track in the view on glyma\.Wm82\.gnm4\.Gm19 spans 2550; a site is drawn only on tracks of its own assembly\./,
    );
  });

  it("says how to recover when it can't place an annotation", () => {
    const reasons = (annot: string) =>
      resolve(annot).unplaced.map((u) => u.reason);
    expect(reasons('box(c=Glyma.q1~nowhere)')).toEqual([
      'nowhere is not in the view; raise neighbors or remove this item.',
    ]);
    expect(reasons('head(c=p9,x=h)')).toEqual([
      "p9 is inserted between consensus columns, so it can't anchor a column; anchor to a gene beside it.",
    ]);
    expect(reasons('box(c=Glyma.q1~s1)')).toEqual([
      'Its genes are in different clusters (Glyma.q1 in 0; s1 in 1); anchor it to genes of one cluster.',
    ]);
  });

  it('asks for cl when the anchors are in several clusters, and uses it', () => {
    // q1 is in cluster 0's query track and cluster 1's match
    expect(resolve('note(g=q1,x=n)').unplaced[0].reason).toBe(
      'Its genes are in clusters 0, 1; add cl with a query gene of the one to use.',
    );
    expect(resolve('note(g=q1,x=n,cl=r1)').placed[0]).toMatchObject({
      cluster: 1,
      track: 1,
    });
  });

  it('keeps each annotation’s ID with its placement or reason', () => {
    const { placed, unplaced } = resolve('head(c=Glyma.q2,x=a);head(c=zz,x=b)');
    expect(placed[0].id).not.toBe(unplaced[0].id);
    expect(placed[0].id).toMatch(/^[0-9a-z]+$/);
  });
});
