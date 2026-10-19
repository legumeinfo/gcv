import { Gene, Plot, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { dotPlotReport, rankCorrelation } from './plots.report';

function track(name: string, families: string[]): Track & ClusterMixin {
  return {
    name,
    families,
    genes: families.map((f, i) => `${name}.g${i}`),
    cluster: 0,
    genus: 'Glycine',
    species: 'max',
    source: 'lis',
    length: 0,
  };
}

function genesAt(t: Track, starts: number[]): [string, Gene][] {
  return t.genes.map((name, i) => [
    geneID(name, t.source),
    {
      name,
      family: t.families[i],
      fmin: starts[i],
      fmax: starts[i] + 100,
      strand: 1,
      chromosome: t.name,
      source: t.source,
    },
  ]);
}

describe('rankCorrelation', () => {
  it('is 1 for collinear and -1 for inverted positions', () => {
    expect(rankCorrelation([1, 2, 3, 4], [10, 20, 30, 40])).toBe(1);
    expect(rankCorrelation([1, 2, 3, 4], [40, 30, 20, 10])).toBe(-1);
  });

  it('needs three pairs and varying positions', () => {
    expect(rankCorrelation([1, 2], [1, 2])).toBeNull();
    expect(rankCorrelation([1, 2, 3], [5, 5, 5])).toBeNull();
  });
});

describe('dotPlotReport', () => {
  // the plotted track holds f1 f2 f3 in reverse, plus a second copy of f2
  const reference = track('Gm01', ['f1', 'f2', 'f3', '']);
  const plotted = track('Pv01', ['f3', 'f2', 'f2', 'f1', '']);
  const plot = new Plot(reference, plotted);

  it('pairs every same-family gene and places pairs at gene midpoints', () => {
    const genes = new Map([
      ...genesAt(reference, [0, 1000, 2000, 3000]),
      ...genesAt(plotted, [0, 1000, 2000, 3000, 4000]),
    ]);
    const report = dotPlotReport(plot, genes, 10);
    expect(report).toMatchObject({
      positions: 'coordinates',
      pairs: 4,
      sharedFamilies: 3,
      omittedPairs: 0,
    });
    expect(report.pairList[0]).toEqual({
      family: 'f1',
      referenceGene: 'Gm01.g0',
      referencePosition: 50,
      plottedGene: 'Pv01.g3',
      plottedPosition: 3050,
    });
    expect(report.rankCorrelation).toBeLessThan(-0.9);
  });

  it('falls back to gene indices until every gene has loaded', () => {
    const genes = new Map(genesAt(reference, [0, 1000, 2000, 3000]));
    const report = dotPlotReport(plot, genes, 2);
    expect(report.positions).toBe('indices');
    expect(report.pairList[0]).toMatchObject({
      referencePosition: 0,
      plottedPosition: 3,
    });
    expect(report.omittedPairs).toBe(2);
  });
});
