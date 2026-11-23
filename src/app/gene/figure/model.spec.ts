import {
  AlignedTrack,
  clusterAlignments,
  sameLocusTracks,
} from '@gcv/gene/alignment';
import { microShim } from '@gcv/gene/components/viewers/micro/micro.shim';
import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { ParsedFigureSpec } from '@gcv/gene/models/params';
import { figureCaption } from './caption';
import { FigureInputs, figureModel } from './model';
import { HOLLOW, NEUTRAL, PALETTE } from './palette';

// A cluster of five tracks, built as the viewer builds them: the soybean
// query; the same locus in another soybean assembly; a common bean region;
// a cowpea region aligned inverted; and a weak lupin hit.
function track(
  name: string,
  genus: string,
  species: string,
  genes: string[],
  families: string[],
  overrides: Partial<AlignedTrack> = {},
): AlignedTrack {
  return {
    name,
    genus,
    species,
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
  'glyma.Wm82.gnm4.Gm15',
  'Glycine',
  'max',
  ['q1', 'q2', 'q3', 'q4', 'q5'].map((g) => `glyma.Wm82.gnm4.ann1.Glyma.${g}`),
  ['a', 'b', 'c', 'd', 'e'],
  { score: 0 },
);
const assembly2 = track(
  'glyma.Wm82.gnm2.Gm15',
  'Glycine',
  'max',
  ['q1', 'q2', 'q3', 'q4', 'q5'].map((g) => `glyma.Wm82.gnm2.ann1.Glyma.${g}`),
  ['a', 'b', 'c', 'd', 'e'],
  { score: 50 },
);
const bean = track(
  'phavu.G19833.gnm2.Chr05',
  'Phaseolus',
  'vulgaris',
  ['p1', 'p2', 'p3', 'p4'],
  ['a', 'b', 'x', 'd'],
  { alignment: [0, 1, 1.5, 3], score: 40 },
);
const cowpea = track(
  'vigun.IT97K.gnm1.Vu01',
  'Vigna',
  'unguiculata',
  ['v1', 'v2', 'v3'],
  ['e', 'd', 'c'],
  { alignment: [4, 3, 2], orientations: [-1, -1, -1], score: 35 },
);
const lupin = track(
  'lupal.Amiga.gnm1.Lalb_Chr03',
  'Lupinus',
  'albus',
  ['l1', 'l2'],
  ['b', ''],
  { alignment: [1, 2], score: 10 },
);
const tracks = [query, assembly2, bean, cowpea, lupin];

// coordinates, so labels have spans: each gene 100 bp, 1 kb apart
const genes: Gene[] = tracks.flatMap((t) =>
  t.genes.map((name, i) => ({
    name,
    family: t.families[i],
    fmin: 10_000 + i * 1000,
    fmax: 10_100 + i * 1000,
    strand: 1,
    chromosome: t.name,
    source: 'lis',
  })),
);

function inputs(spec: ParsedFigureSpec): FigureInputs {
  const { data } = microShim(0, [query], tracks, genes, []);
  const [alignment] = clusterAlignments(
    [['a', 'b', 'c', 'd', 'e']],
    tracks,
    new Set([query]),
    new Map(genes.map((g) => [geneID(g.name, g.source), g])),
  );
  return {
    drawn: data,
    alignment,
    sameLocus: sameLocusTracks([alignment]),
    spec,
  };
}

const chromosomes = (spec: ParsedFigureSpec) =>
  figureModel(inputs(spec)).manifest.tracks.map((t) => t.chromosome);

describe('choosing tracks', () => {
  it('keeps every track by default, the query first', () => {
    expect(chromosomes({})).toEqual(tracks.map((t) => t.name));
  });

  it('keeps the best result tracks by score, in the view’s order', () => {
    expect(chromosomes({ top: 2 })).toEqual([
      query.name,
      assembly2.name,
      bean.name,
    ]);
  });

  it('keeps genera, and orders by genus or score', () => {
    expect(chromosomes({ genus: ['Vigna', 'Phaseolus'] })).toEqual([
      query.name,
      bean.name,
      cowpea.name,
    ]);
    expect(
      chromosomes({ order: { genera: ['Vigna', 'Lupinus'] }, top: 3 }),
    ).toEqual([query.name, cowpea.name, assembly2.name, bean.name]);
    expect(
      chromosomes({ order: 'score', genus: ['Vigna', 'Phaseolus'] }),
    ).toEqual([query.name, bean.name, cowpea.name]);
  });

  it('keeps the tracks named by a gene, noting a gene in none', () => {
    const model = figureModel(inputs({ tracks: ['v2', 'nowhere'] }));
    expect(model.manifest.tracks.map((t) => t.chromosome)).toEqual([
      query.name,
      cowpea.name,
    ]);
    expect(model.notes).toEqual(['No result track has the gene nowhere.']);
  });

  it('counts the result tracks shown against the cluster’s', () => {
    expect(figureModel(inputs({ top: 1 })).manifest.resultTracks).toEqual({
      shown: 1,
      of: 4,
    });
  });
});

describe('merging one locus shown twice', () => {
  it('merges only pairs with both kinds of evidence, keeping the query', () => {
    const { manifest, figure } = figureModel(inputs({ merge: 'both' }));
    expect(manifest.tracks.map((t) => t.chromosome)).not.toContain(
      assembly2.name,
    );
    expect(manifest.tracks[0]).toMatchObject({
      chromosome: query.name,
      mergedWith: assembly2.name,
    });
    expect(figure.tracks[0].locus).toContain('= gnm2.Gm15');
  });

  it('merges a pair the user names, and refuses one it can’t place', () => {
    const named = figureModel(
      inputs({ merge: [['p1', 'v1']] }),
    ).manifest.tracks.find((t) => t.mergedWith !== undefined);
    expect(named).toMatchObject({
      chromosome: bean.name,
      mergedWith: cowpea.name,
    });
    const refused = figureModel(inputs({ merge: [['p1', 'p2']] }));
    expect(refused.manifest.tracks).toHaveLength(5);
    expect(refused.notes[0]).toMatch(/^Not merged: p1 and p2/);
  });
});

describe('cropping columns', () => {
  const model = figureModel(
    inputs({ crop: ['glyma.Wm82.gnm4.ann1.Glyma.q3', 'Glyma.q2'] }),
  );

  it('shows the columns between the named genes, in either order', () => {
    expect(model.figure.columns).toEqual([0.5, 2.5]);
    expect(model.manifest.columns).toEqual({
      from: 1,
      to: 2,
      crop: ['glyma.Wm82.gnm4.ann1.Glyma.q3', 'Glyma.q2'],
    });
    // the inserted gene between them included
    expect(model.figure.tracks.flatMap((t) => t.genes).map((g) => g.x)).toEqual(
      [1, 2, 1, 2, 1, 1.5, 2, 1, 2],
    );
  });

  it('spans each label over the genes drawn, not the whole track', () => {
    const q = model.manifest.tracks[0];
    expect([q.fmin, q.fmax]).toEqual([11_000, 12_100]);
    // the species and strain are the label's binomial
    expect(model.figure.tracks[0].locus).toBe('gnm4.Gm15: 0.011–0.012 Mb');
  });

  it('ends a rail at the edge toward a neighbor outside the columns', () => {
    const rails = model.figure.tracks[0].rails;
    expect(rails.map((r) => r.to)).toEqual(['left', 1, 'right']);
  });

  it('leaves out a gene inserted past the last column, ending its rail at the edge', () => {
    // p3 is inserted after q2's column, the crop's last
    const narrow = figureModel(inputs({ crop: ['Glyma.q2', 'Glyma.q2'] }));
    const i = narrow.manifest.tracks.findIndex(
      (t) => t.chromosome === bean.name,
    );
    expect(narrow.figure.tracks[i].genes.map((g) => g.name)).toEqual(['p2']);
    expect(narrow.figure.tracks[i].rails.map((r) => r.to)).toEqual([
      'left',
      'right',
    ]);
  });

  it('leaves out a track with no gene in the columns, saying so', () => {
    const narrow = figureModel(inputs({ crop: ['Glyma.q5', 'Glyma.q5'] }));
    expect(narrow.manifest.tracks.map((t) => t.chromosome)).not.toContain(
      bean.name,
    );
    expect(narrow.notes).toContain(
      `Left out ${bean.name}: none of its genes are in the columns shown.`,
    );
  });

  it('refuses a crop whose ends it can’t place', () => {
    const model = figureModel(inputs({ crop: ['Glyma.q2', 'p3'] }));
    expect(model.figure.columns).toEqual([-0.5, 4.5]);
    expect(model.notes[0]).toMatch(/^Not cropped: p3/);
  });
});

describe('coloring families', () => {
  const styles = (spec: ParsedFigureSpec) =>
    Object.fromEntries(
      figureModel(inputs(spec))
        .figure.tracks.flatMap((t) => t.genes)
        .map((g) => [g.name, [g.style, g.fill]]),
    );

  it("colors the query's families that other tracks share, each its own color", () => {
    const { manifest } = figureModel(inputs({}));
    expect(manifest.colours).toEqual(
      ['a', 'b', 'c', 'd', 'e'].map((family, i) => ({
        family,
        colour: PALETTE[i],
        key: i + 1,
      })),
    );
  });

  it('draws a family with no other gene shown hollow, and no family dashed', () => {
    const s = styles({});
    expect(s['p3']).toEqual(['hollow', HOLLOW]);
    expect(s['l2']).toEqual(['orphan', HOLLOW]);
  });

  it('draws the families not colored grey', () => {
    const s = styles({ colour: ['b'] });
    expect(s['p2']).toEqual(['colour', PALETTE[0]]);
    expect(s['p1']).toEqual(['neutral', NEUTRAL]);
  });

  it("keeps a family's color however the tracks are ordered or chosen", () => {
    const colour = (spec: ParsedFigureSpec) =>
      figureModel(inputs({ ...spec, colour: ['d', 'b'] })).manifest.colours;
    expect(colour({ order: 'score' })).toEqual(colour({}));
    expect(colour({ top: 1 })).toEqual(colour({}));
  });

  it('notes the families it can’t color', () => {
    const { notes } = figureModel(inputs({ colour: ['x', 'zz'] }));
    expect(notes).toEqual([
      'Not colored: family zz has no gene in the figure.',
      'Not colored: family x has no other gene in the figure, so it is drawn hollow.',
    ]);
  });

  it('never reuses a color when the families outnumber the palette', () => {
    // a query of more shared families than the palette has colors
    const families = Array.from(
      { length: PALETTE.length + 2 },
      (_, i) => `f${i}`,
    );
    const names = families.map((f) => `g${f}`);
    const many = [
      track('Gm01', 'Glycine', 'max', names, families, { score: 0 }),
      track(
        'Pv01',
        'Phaseolus',
        'vulgaris',
        names.map((n) => `p${n}`),
        families,
      ),
    ];
    const { data } = microShim(0, [many[0]], many, [], []);
    const [alignment] = clusterAlignments(
      [families],
      many,
      new Set([many[0]]),
      new Map(),
    );
    const model = (spec: ParsedFigureSpec) =>
      figureModel({
        drawn: data,
        alignment,
        sameLocus: [],
        spec,
      });
    // by default, only as many as have colors, without a note
    expect(model({}).manifest.colours).toHaveLength(PALETTE.length);
    expect(model({}).notes.join()).not.toMatch(/distinct colors/);
    const all = model({ colour: families, famlabels: true });
    const used = all.manifest.colours
      .map((c) => c.colour)
      .filter((c) => c !== null);
    expect(new Set(used).size).toBe(PALETTE.length);
    expect(all.manifest.colours.slice(-2).map((c) => c.colour)).toEqual([
      null,
      null,
    ]);
    expect(all.notes.join()).toMatch(/drawn grey, with their legend numbers/);
    // every grey gene is numbered, so the legend needs no unnumbered grey
    expect(all.figure.legend.map((e) => e.key)).toEqual(
      families.map((_, i) => i + 1),
    );
  });
});

describe('the rest of the figure', () => {
  it('uses the spec’s size and options, with defaults', () => {
    expect(figureModel(inputs({})).figure).toMatchObject({
      size: { width: 180, font: 7 },
      names: false,
      famlabels: false,
      printCaption: false,
    });
    expect(
      figureModel(inputs({ w: 85, font: 6, glyph: 2, legend: false })).figure,
    ).toMatchObject({ size: { width: 85, font: 6, glyph: 2 }, legend: null });
  });

  it('puts the strain after the italic binomial', () => {
    const strained = track('Gm01', 'Glycine', 'max:Wm82', ['g'], ['a'], {
      score: 0,
    });
    const { data } = microShim(0, [strained], [strained], [], []);
    const [alignment] = clusterAlignments(
      [['a']],
      [strained],
      new Set([strained]),
      new Map(),
    );
    const [label] = figureModel({
      drawn: data,
      alignment,
      sameLocus: [],
      spec: { labels: 'short' },
    }).figure.tracks;
    expect([label.binomial, label.strain, label.locus]).toEqual([
      'Glycine max',
      'Wm82',
      'Gm01',
    ]);
  });

  it('shortens LIS chromosome names whose species abbreviation has digits', () => {
    const tomentella = track(
      'glyd3.G1403.gnm1.Chr16',
      'Glycine',
      'D3-tomentella:G1403',
      ['g'],
      ['a'],
      {
        score: 0,
      },
    );
    const { data } = microShim(0, [tomentella], [tomentella], [], []);
    const [alignment] = clusterAlignments(
      [['a']],
      [tomentella],
      new Set([tomentella]),
      new Map(),
    );
    const label = (labels: 'full' | 'short') =>
      figureModel({
        drawn: data,
        alignment,
        sameLocus: [],
        spec: { labels },
      }).figure.tracks[0].locus;
    expect(label('short')).toBe('Chr16');
    expect(label('full')).toMatch(/^gnm1\.Chr16: /);
  });

  it('gives a reversed track’s span high to low, and says so', () => {
    const { figure, manifest } = figureModel(inputs({}));
    const i = manifest.tracks.findIndex((t) => t.chromosome === cowpea.name);
    expect(figure.tracks[i].locus).toBe('gnm1.Vu01: 0.012–0.010 Mb (rev.)');
    expect(figure.tracks[0].locus).not.toContain('rev.');
  });

  it('groups tracks of one genome, as two assemblies of it', () => {
    const { figure } = figureModel(inputs({}));
    expect(figure.tracks[0].genome).toBe(figure.tracks[1].genome);
    expect(figure.tracks[1].genome).not.toBe(figure.tracks[2].genome);
  });

  it('names the families in the key by their IDs, the shared prefix once', () => {
    const families = (fs: string[]) => {
      const rename = (f: string) =>
        f === '' ? f : (fs[['a', 'b', 'c', 'd', 'e'].indexOf(f)] ?? f);
      const named = tracks.map((t) => ({
        ...t,
        families: t.families.map(rename),
      }));
      const renamed = genes.map((g) => ({ ...g, family: rename(g.family) }));
      const { data } = microShim(0, [named[0]], named, renamed, []);
      const [alignment] = clusterAlignments(
        [fs],
        named,
        new Set([named[0]]),
        new Map(),
      );
      return figureModel({ drawn: data, alignment, sameLocus: [], spec: {} })
        .figure;
    };
    const prefixed = families(['fam.A', 'fam.B', 'fam.C', 'fam.D', 'fam.E']);
    expect(prefixed.legendTitle).toBe('Gene families (fam):');
    expect(prefixed.legend[0].label).toBe('A');
    const plain = families(['A', 'B', 'C', 'D', 'E']);
    expect(plain.legendTitle).toBe('Gene families:');
    expect(plain.legend[0].label).toBe('A');
  });

  it('shortens LIS names for short labels and gene names', () => {
    const { figure } = figureModel(inputs({ labels: 'short' }));
    expect(figure.tracks[0].locus).toBe('Gm15');
    expect(figure.tracks[0].genes[0].label).toBe('Glyma.q1');
  });

  it('says when genes’ coordinates are still loading', () => {
    expect(figureModel(inputs({})).loading).toBe(false);
    const { data } = microShim(0, [query], tracks, [], []);
    const loading = figureModel({ ...inputs({}), drawn: data });
    expect(loading.loading).toBe(true);
    expect(loading.notes.join(' ')).toContain("coordinates haven't loaded");
  });

  it('reports the parts of the parameter it couldn’t read', () => {
    expect(figureModel(inputs({ rejected: ['w:900'] })).notes).toEqual([
      "The figure's parameter had unreadable parts, left out: w:900.",
    ]);
  });

  it('writes a caption with the counts, parameters and link', () => {
    const { manifest } = figureModel(inputs({ top: 2 }));
    const caption = figureCaption(manifest, {
      queryGenes: ['Glyma.q3'],
      params: {
        sources: ['lis'],
        neighbors: 10,
        matched: 4,
        intermediate: 5,
        algorithm: 'repeat',
        match: 10,
        mismatch: -1,
        gap: -1,
        score: 30,
        threshold: 25,
        linkage: 'average',
        cthreshold: 20,
        regexp: 'Glycine|Phaseolus',
      } as never,
      url: 'http://gcv/gene;lis=Glyma.q3?fig=top:2',
      version: '2.7.1',
      date: '2026-10-28',
    });
    expect(caption).toContain(
      "1 query track and 2 of the cluster's 4 result tracks",
    );
    expect(caption).toContain('neighbors 10, matched 4, intermediate 5');
    expect(caption).toContain(
      'Genomes shown match the regular expression Glycine|Phaseolus.',
    );
    expect(caption).toMatch(
      /Made with GCV 2\.7\.1 on 2026-10-28: http:\/\/gcv\/gene;lis=Glyma\.q3\?fig=top:2$/,
    );
  });
});

describe('the author’s marks', () => {
  const q = (n: string) => `glyma.Wm82.gnm4.ann1.Glyma.${n}`;

  it('emphasises, names and spans genes the figure draws', () => {
    const { figure, manifest, notes } = figureModel(
      inputs({
        em: [q('q2')],
        name: [
          { gene: q('q3'), text: 'Dt1' },
          { gene: 'p4', text: 'P4' },
        ],
        span: [{ from: q('q4'), to: q('q2'), text: 'block' }],
      }),
    );
    expect(notes).toEqual([]);
    const emphasised = figure.tracks
      .flatMap((t) => t.genes)
      .filter((g) => g.emphasis)
      .map((g) => g.name);
    expect(emphasised).toEqual([q('q2')]);
    const beanTrack = manifest.tracks.findIndex(
      (t) => t.chromosome === bean.name,
    );
    expect(figure.marks.names).toEqual([
      { track: 0, x: 2, y: 0, text: 'Dt1' },
      { track: beanTrack, x: 3, y: 0, text: 'P4' },
    ]);
    expect(figure.marks.spans).toEqual([{ from: 1, to: 3, text: 'block' }]);
    expect(manifest.marks.spans[0]).toMatchObject({ columns: [1, 3] });
  });

  it('places a position through the genes of each track on its chromosome', () => {
    const { figure, manifest } = figureModel(
      inputs({
        pos: [
          // inside q3, then between q2 and q3
          { chromosome: query.name, position: 12_050, text: 'in' },
          { chromosome: query.name, position: 11_550 },
        ],
      }),
    );
    expect(figure.marks.positions).toEqual([
      { track: 0, x: 2, y: 0, inGene: true, text: 'in' },
      { track: 0, x: 1.5, y: 0, inGene: false },
    ]);
    expect(manifest.marks.positions[0]).toMatchObject({ tracks: 1 });
  });

  it('notes the marks it can’t place, and draws none of them', () => {
    const { figure, notes } = figureModel(
      inputs({
        em: ['nowhere'],
        name: [{ gene: 'Glyma.q2', text: 'two' }],
        pos: [
          { chromosome: 'glyma.Wm82.gnm6.Gm15', position: 12_050 },
          { chromosome: query.name, position: 99_000 },
        ],
      }),
    );
    expect(figure.marks).toEqual({ names: [], spans: [], positions: [] });
    expect(notes).toEqual([
      'Not drawn: the emphasis on nowhere; nowhere is not in the figure.',
      expect.stringMatching(
        /^Not drawn: the name “two”; Glyma\.q2 names several genes .*use the full name\.$/,
      ),
      expect.stringMatching(
        /^Not drawn: the position glyma\.Wm82\.gnm6\.Gm15:12050; no track in the figure on glyma\.Wm82\.gnm6\.Gm15 has genes around it\./,
      ),
      expect.stringMatching(
        /^Not drawn: the position glyma\.Wm82\.gnm4\.Gm15:99000;/,
      ),
    ]);
  });

  it('says in the caption what each mark marks', () => {
    const { manifest } = figureModel(
      inputs({
        em: [q('q2')],
        name: [{ gene: q('q3'), text: 'Dt1' }],
        span: [{ from: q('q2'), to: q('q4'), text: 'block' }],
        pos: [{ chromosome: query.name, position: 12_050, text: 'R166W' }],
      }),
    );
    const caption = figureCaption(manifest, {
      queryGenes: [q('q3')],
      params: { sources: ['lis'] } as never,
      url: 'http://gcv/gene',
      version: '2.7.1',
      date: '2026-11-23',
    });
    expect(caption).toContain(`Heavier outlines mark ${q('q2')}.`);
    expect(caption).toContain(`Italic names label ${q('q3')} (Dt1).`);
    expect(caption).toContain(
      `A rule above the tracks marks “block” columns 1 to 3, from ${q('q2')} to ${q('q4')}.`,
    );
    expect(caption).toContain(
      `A dot on a stem marks “R166W” ${query.name}:12,050, placed among the genes of each track on that chromosome.`,
    );
  });
});
