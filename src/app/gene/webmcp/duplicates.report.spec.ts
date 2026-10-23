import { Gene } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { clusterAlignments } from './alignment.report';
import { sameLocusTracks } from './duplicates.report';
import { AlignedTrack } from './view-state';

function track(
  name: string,
  genes: string[],
  overrides: Partial<AlignedTrack> = {},
): AlignedTrack {
  return {
    name,
    genes,
    length: 0,
    genus: 'Vigna',
    species: 'unguiculata:IT97K-499-35',
    source: 'lis',
    cluster: 0,
    families: genes.map(() => 'f'),
    alignment: genes.map((_, i) => i),
    orientations: genes.map(() => 1),
    segments: genes.map(() => 0),
    score: 40,
    ...overrides,
  };
}

// genes at the given starts, each 1000 long
function located(t: AlignedTrack, starts: number[]): [string, Gene][] {
  return t.genes.map((name, i) => [
    geneID(name, t.source),
    {
      name,
      family: 'f',
      fmin: starts[i],
      fmax: starts[i] + 1000,
      strand: 1,
      chromosome: t.name,
      source: t.source,
    },
  ]);
}

const query = track('glyma.Wm82.gnm4.Gm15', ['q1'], {
  genus: 'Glycine',
  species: 'max:Wm82',
});

function pairs(tracks: [AlignedTrack, number[]][]) {
  const genes = new Map(tracks.flatMap(([t, starts]) => located(t, starts)));
  const clusters = clusterAlignments(
    [['f', 'f', 'f']],
    [query, ...tracks.map(([t]) => t)],
    new Set([query]),
    genes,
  );
  return sameLocusTracks(clusters).map((p) => ({
    evidence: p.evidence,
    chromosomes: p.tracks.map((t) => t.chromosome),
  }));
}

describe('sameLocusTracks', () => {
  it('flags two annotations of one assembly', () => {
    const ann1 = track('vigun.IT97K-499-35.gnm1.ann1.Vu01', [
      'vigun.IT97K-499-35.gnm1.ann1.Vigun01g059200',
      'vigun.IT97K-499-35.gnm1.ann1.Vigun01g059300',
    ]);
    const ann2 = track('vigun.IT97K-499-35.gnm1.Vu01', [
      'vigun.IT97K-499-35.gnm1.ann2.Vigun01g059200',
      'vigun.IT97K-499-35.gnm1.ann2.Vigun01g059350',
      'vigun.IT97K-499-35.gnm1.ann2.Vigun01g059300',
    ]);
    expect(
      pairs([
        [ann1, [12_336_449, 12_392_719]],
        [ann2, [12_336_449, 12_410_124, 12_392_713]],
      ]),
    ).toEqual([
      {
        evidence: ['gene names', 'coordinates'],
        chromosomes: [
          'vigun.IT97K-499-35.gnm1.ann1.Vu01',
          'vigun.IT97K-499-35.gnm1.Vu01',
        ],
      },
    ]);
  });

  it('flags one locus in two assemblies, with the query track', () => {
    const gnm2 = track('glyma.Wm82.gnm2.Gm15', ['glyma.Wm82.gnm2.ann1.q1'], {
      genus: 'Glycine',
      species: 'max:Wm82',
    });
    expect(pairs([[gnm2, [48_400_000]]])).toEqual([
      {
        evidence: ['gene names'],
        chromosomes: ['glyma.Wm82.gnm4.Gm15', 'glyma.Wm82.gnm2.Gm15'],
      },
    ]);
  });

  it('leaves alone other genomes, other loci and one chromosome', () => {
    const vr05 = track('vigra.VC1973A.gnm6.Vr05', ['vigra.gnm6.Vradi05g1'], {
      species: 'radiata:VC1973A',
    });
    const chr9 = track('vigra.VC1973A.gnm7.chr9', ['vigra.gnm7.Vradi09g2'], {
      species: 'radiata:VC1973A',
    });
    // another strain's track with the same gene names
    const strain = track('vigun.Other.gnm1.Vu01', ['x.Vigun01g059200'], {
      species: 'unguiculata:Other',
    });
    const vu01 = track('vigun.IT97K-499-35.gnm1.Vu01', ['y.Vigun01g059200']);
    // a second alignment on one chromosome
    const again = track('vigun.IT97K-499-35.gnm1.Vu01', ['y.Vigun01g059200']);
    expect(
      pairs([
        [vr05, [30_070_645]],
        [chr9, [30_070_645]],
        [strain, [100]],
        [vu01, [100]],
        [again, [100]],
      ]),
    ).toEqual([]);
  });
});
