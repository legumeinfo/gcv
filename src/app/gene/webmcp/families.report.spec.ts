import { familiesReport, familyMembers } from './families.report';
import { AlignedTrack } from './view-state';

function track(
  name: string,
  families: string[],
  species = 'max',
  cluster = 0,
): AlignedTrack {
  return {
    name,
    families,
    genes: families.map((f, i) => `${name}.g${i}`),
    cluster,
    species,
    genus: 'Glycine',
    source: 'lis',
    length: 0,
    alignment: families.map((f, i) => i),
    orientations: families.map(() => 1),
    segments: families.map(() => 0),
    score: 0,
  };
}

// fa: one copy on the query, a tandem pair and a lone copy on the result
// fb: one copy on each track; fs: a singleton; '': an orphan
const query = track('Gm01', ['fa', 'fb', 'fs']);
const result = track('Pv01', ['fa', 'fa', 'fb', '', 'fa'], 'vulgaris');
const colors = { fa: '#7A2719' };
const color = (f: string) => colors[f] ?? null;

describe('familiesReport', () => {
  const report = familiesReport(
    [query, result, Object.create(result)],
    [query],
    { omitted: ['fb'], color },
  );

  it('counts copies per family across tracks and species', () => {
    const fa = report.familyReports.find((r) => r.family === 'fa');
    expect(fa).toEqual({
      family: 'fa',
      genes: 4,
      tracks: 2,
      maxCopiesPerTrack: 3,
      tandemArrays: 1,
      bySpecies: { 'Glycine max': 1, 'Glycine vulgaris': 3 },
      onQueryTrack: true,
      color: '#7A2719',
      deemphasized: false,
    });
  });

  it('orders families by gene count and reports emphasis', () => {
    expect(report.familyReports.map((r) => r.family)).toEqual(['fa', 'fb']);
    expect(report.familyReports[1]).toMatchObject({
      genes: 2,
      tandemArrays: 0,
      color: null,
      deemphasized: true,
    });
  });

  it('separates singletons and orphans, counting a realigned track once', () => {
    expect(report).toMatchObject({
      tracks: 2,
      families: 3,
      singletons: ['fs'],
      orphans: 1,
      species: [
        { species: 'Glycine max', tracks: 1 },
        { species: 'Glycine vulgaris', tracks: 1 },
      ],
    });
  });
});

describe('familyMembers', () => {
  it("lists the family's genes on each track that holds it", () => {
    expect(familyMembers([query, result], [query], 'fa').tracks).toEqual([
      {
        role: 'query',
        cluster: 0,
        species: 'Glycine max',
        chromosome: 'Gm01',
        source: 'lis',
        genes: ['Gm01.g0'],
      },
      {
        role: 'result',
        cluster: 0,
        species: 'Glycine vulgaris',
        chromosome: 'Pv01',
        source: 'lis',
        genes: ['Pv01.g0', 'Pv01.g1', 'Pv01.g4'],
      },
    ]);
  });
});
