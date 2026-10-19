import { WebMcpToolError } from '@gcv/core/webmcp/webmcp';
import { matchGeneName, matchTracks, resolveTrack } from './lookup';
import { AlignedTrack } from './view-state';

function track(
  name: string,
  genes: string[],
  cluster = 0,
  source = 'lis',
): AlignedTrack {
  return {
    name,
    genes,
    cluster,
    source,
    length: 0,
    genus: 'Glycine',
    species: 'max',
    families: genes.map(() => 'f'),
    alignment: genes.map((g, i) => i),
    orientations: genes.map(() => 1),
    segments: genes.map(() => 0),
    score: 0,
  };
}

describe('matchGeneName', () => {
  const names = [
    'glyma.Wm82.gnm4.ann1.Glyma.12G040000',
    'glyma.Wm82.gnm2.ann1.Glyma.12G040000',
    'phavu.G19833.gnm2.ann1.Phvul.002G085200',
  ];

  it('prefers the exact name', () => {
    expect(matchGeneName(names, names[0])).toEqual([names[0]]);
  });

  it('matches a name without its prefix, case-insensitively', () => {
    expect(matchGeneName(names, 'phvul.002g085200')).toEqual([names[2]]);
  });

  it('returns every full name an ambiguous name matches', () => {
    expect(matchGeneName(names, 'Glyma.12G040000')).toEqual(names.slice(0, 2));
  });

  it("doesn't match part of a name segment", () => {
    expect(matchGeneName(names, '2G040000')).toEqual([]);
  });
});

describe('matchTracks', () => {
  const a = track('glyma.Wm82.gnm4.Gm12', ['g1', 'g2', 'g3']);
  const b = track('glyma.Wm82.gnm4.Gm12', ['g7', 'g8', 'g9']);
  const c = track('glyma.Wm82.gnm4.Gm12', ['g1', 'g2', 'g3'], 1);
  // the 'repeat' algorithm aligns a track more than once
  const aAgain = Object.create(a);

  it('finds tracks by chromosome, counting a realigned track once', () => {
    expect(matchTracks([a, aAgain, b, c], { chromosome: 'Gm12' })).toEqual([
      a,
      b,
      c,
    ]);
  });

  it('narrows by cluster, gene and source', () => {
    const tracks = [a, b, c];
    expect(matchTracks(tracks, { chromosome: 'Gm12', cluster: 1 })).toEqual([
      c,
    ]);
    expect(matchTracks(tracks, { chromosome: 'Gm12', gene: 'g8' })).toEqual([
      b,
    ]);
    expect(
      matchTracks(tracks, { chromosome: 'Gm12', source: 'other' }),
    ).toEqual([]);
  });
});

describe('resolveTrack', () => {
  const a = track('Gm12', ['g1', 'g2']);
  const b = track('Gm12', ['g7', 'g8']);

  it('returns the one matching track', () => {
    expect(resolveTrack([a, b], { chromosome: 'Gm12', gene: 'g2' })).toBe(a);
  });

  it('names the candidates when several tracks match', () => {
    expect(() => resolveTrack([a, b], { chromosome: 'Gm12' })).toThrow(
      /Several tracks match.*"firstGene":"g1".*"firstGene":"g7"/,
    );
  });

  it("names the view's chromosomes when none matches", () => {
    expect(() => resolveTrack([a, b], { chromosome: 'Chr01' })).toThrow(
      WebMcpToolError,
    );
    expect(() => resolveTrack([a, b], { chromosome: 'Chr01' })).toThrow(
      /Chromosomes in the view: Gm12\./,
    );
  });
});
