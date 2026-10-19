// Pure report of the macro-synteny blocks between a query chromosome and the
// target chromosomes of each source. A block's i and j index the query
// chromosome's genes; its fmin and fmax are positions on the target.
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { Gene, PairwiseBlocks, Track } from '@gcv/gene/models';

export type BlockReport = {
  orientation: '+' | '-';
  query: {
    startGene: string;
    stopGene: string;
    genes: number;
    fmin?: number;
    fmax?: number;
  };
  target: { fmin: number; fmax: number };
  // distance between the block's query and target family 2-grams; lower is
  // more similar (the 'distance' target order uses it)
  jaccardDistance?: number;
};

export type MacroSyntenyReport = {
  query: {
    chromosome: string;
    source: string;
    genus: string;
    species: string;
    genes: number;
    length: number;
  };
  summary: {
    targets: number;
    blocks: number;
    // per target species: how much of the query chromosome its blocks cover,
    // and how many times over (depth > 1 suggests duplicated segments)
    bySpecies: {
      genus: string;
      species: string;
      targets: number;
      blocks: number;
      queryGenesCovered: number;
      meanDepth: number;
    }[];
  };
  targets: {
    chromosome: string;
    source: string;
    genus: string;
    species: string;
    blocks: BlockReport[];
  }[];
  truncated: boolean;
};

export function blockEndpointGenes(
  query: Track,
  pairwiseBlocks: PairwiseBlocks[],
): string[] {
  const names = new Set<string>();
  pairwiseBlocks.forEach((p) =>
    p.blocks.forEach((b) => {
      names.add(query.genes[b.i]);
      names.add(query.genes[b.j]);
    }),
  );
  return Array.from(names);
}

// pairwiseBlocks are expected in the view's filtered order; targets past
// maxTargets are left out but still counted in the summary
export function macroSyntenyReport(
  query: Track,
  pairwiseBlocks: PairwiseBlocks[],
  genes: Map<string, Gene>,
  maxTargets: number,
): MacroSyntenyReport {
  const located = (name: string) => genes.get(geneID(name, query.source));
  const species = new Map<
    string,
    {
      genus: string;
      species: string;
      targets: number;
      blocks: number;
      covered: Set<number>;
      span: number;
    }
  >();
  pairwiseBlocks.forEach((p) => {
    const key = `${p.chromosomeGenus} ${p.chromosomeSpecies}`;
    if (!species.has(key)) {
      species.set(key, {
        genus: p.chromosomeGenus,
        species: p.chromosomeSpecies,
        targets: 0,
        blocks: 0,
        covered: new Set(),
        span: 0,
      });
    }
    const s = species.get(key);
    s.targets += 1;
    s.blocks += p.blocks.length;
    p.blocks.forEach((b) => {
      for (let i = b.i; i <= b.j; i++) {
        s.covered.add(i);
      }
      s.span += b.j - b.i + 1;
    });
  });
  const targets = pairwiseBlocks.slice(0, maxTargets).map((p) => ({
    chromosome: p.chromosome,
    source: p.chromosomeSource,
    genus: p.chromosomeGenus,
    species: p.chromosomeSpecies,
    blocks: p.blocks.map((b): BlockReport => {
      const start = located(query.genes[b.i]);
      const stop = located(query.genes[b.j]);
      const report: BlockReport = {
        orientation: b.orientation,
        query: {
          startGene: query.genes[b.i],
          stopGene: query.genes[b.j],
          genes: b.j - b.i + 1,
        },
        target: { fmin: b.fmin, fmax: b.fmax },
      };
      if (start !== undefined && stop !== undefined) {
        report.query.fmin = Math.min(start.fmin, stop.fmin);
        report.query.fmax = Math.max(start.fmax, stop.fmax);
      }
      const metrics = (b as { optionalMetrics?: number[] }).optionalMetrics;
      if (metrics !== undefined && metrics.length > 0) {
        report.jaccardDistance = metrics[0];
      }
      return report;
    }),
  }));
  return {
    query: {
      chromosome: query.name,
      source: query.source,
      genus: query.genus,
      species: query.species,
      genes: query.genes.length,
      length: query.length,
    },
    summary: {
      targets: pairwiseBlocks.length,
      blocks: pairwiseBlocks.reduce((n, p) => n + p.blocks.length, 0),
      bySpecies: Array.from(species.values()).map((s) => ({
        genus: s.genus,
        species: s.species,
        targets: s.targets,
        blocks: s.blocks,
        queryGenesCovered: s.covered.size,
        meanDepth:
          s.covered.size === 0
            ? 0
            : Math.round((s.span / s.covered.size) * 100) / 100,
      })),
    },
    targets,
    truncated: pairwiseBlocks.length > maxTargets,
  };
}
