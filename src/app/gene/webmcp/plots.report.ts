// Dot plots as data: every pair of genes from the same family, one on a
// reference (a query track, or a whole query chromosome) and one on the plotted
// track. The viewer places a pair at the genes' midpoints when every gene has
// loaded, and at their indices on the tracks otherwise; so does this report.
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { Gene, Plot, Track } from '@gcv/gene/models';

export type DotPlotPair = {
  family: string;
  referenceGene: string;
  referencePosition: number;
  plottedGene: string;
  plottedPosition: number;
};

export type DotPlotReport = {
  reference: TrackSummary;
  plotted: TrackSummary;
  positions: 'coordinates' | 'indices';
  pairs: number;
  sharedFamilies: number;
  // Spearman's rank correlation of the pairs' positions: near 1 for collinear
  // genes, near -1 for inverted ones, null with fewer than three pairs
  rankCorrelation: number | null;
  pairList: DotPlotPair[];
  omittedPairs: number;
};

type TrackSummary = {
  chromosome: string;
  source: string;
  species: string;
  genes: number;
};

const summary = (t: Track): TrackSummary => ({
  chromosome: t.name,
  source: t.source,
  species: `${t.genus} ${t.species}`,
  genes: t.genes.length,
});

// ranks from 1, ties sharing their mean rank
function ranks(values: number[]): number[] {
  const order = values.map((v, i) => i).sort((a, b) => values[a] - values[b]);
  const result = new Array<number>(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && values[order[j + 1]] === values[order[i]]) {
      j += 1;
    }
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      result[order[k]] = rank;
    }
    i = j + 1;
  }
  return result;
}

export function rankCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) {
    return null;
  }
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mean = (rx.length + 1) / 2;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  rx.forEach((x, i) => {
    sxy += (x - mean) * (ry[i] - mean);
    sxx += (x - mean) ** 2;
    syy += (ry[i] - mean) ** 2;
  });
  if (sxx === 0 || syy === 0) {
    return null;
  }
  return Math.round((sxy / Math.sqrt(sxx * syy)) * 1000) / 1000;
}

export function dotPlotReport(
  plot: Plot,
  genes: Map<string, Gene>,
  maxPairs: number,
): DotPlotReport {
  const { reference, sequence } = plot;
  const referenceGene = (i: number) =>
    genes.get(geneID(reference.genes[i], reference.source));
  const plottedGene = (j: number) =>
    genes.get(geneID(sequence.genes[j], sequence.source));
  const located = plot.pairs.every(
    ({ i, j }) =>
      referenceGene(i) !== undefined && plottedGene(j) !== undefined,
  );
  const midpoint = (g: Gene) => (g.fmin + g.fmax) / 2;
  const pairs: DotPlotPair[] = plot.pairs.map(({ i, j }) => ({
    family: reference.families[i],
    referenceGene: reference.genes[i],
    referencePosition: located ? midpoint(referenceGene(i)) : i,
    plottedGene: sequence.genes[j],
    plottedPosition: located ? midpoint(plottedGene(j)) : j,
  }));
  return {
    reference: summary(reference),
    plotted: summary(sequence),
    positions: located ? 'coordinates' : 'indices',
    pairs: pairs.length,
    sharedFamilies: new Set(pairs.map((p) => p.family)).size,
    rankCorrelation: rankCorrelation(
      pairs.map((p) => p.plottedPosition),
      pairs.map((p) => p.referencePosition),
    ),
    pairList: pairs.slice(0, maxPairs),
    omittedPairs: Math.max(0, pairs.length - maxPairs),
  };
}
