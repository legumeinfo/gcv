import { Gene, PairwiseBlocks, Track } from '@gcv/gene/models';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { blockEndpointGenes, macroSyntenyReport } from './blocks.report';

const query: Track = {
  name: 'Gm01',
  genus: 'Glycine',
  species: 'max',
  source: 'lis',
  length: 1000,
  genes: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'],
  families: ['a', 'b', 'c', 'd', 'e', 'f'],
};

function target(
  chromosome: string,
  species: string,
  blocks: { i: number; j: number; metric?: number }[],
): PairwiseBlocks {
  return {
    reference: 'Gm01',
    referenceSource: 'lis',
    chromosome,
    chromosomeSource: 'lis',
    chromosomeGenus: 'Phaseolus',
    chromosomeSpecies: species,
    blocks: blocks.map(({ i, j, metric }) => ({
      orientation: '+',
      i,
      j,
      fmin: i * 10,
      fmax: j * 10,
      ...(metric === undefined ? {} : { optionalMetrics: [metric] }),
    })),
  };
}

const gene = (name: string, fmin: number, fmax: number): [string, Gene] => [
  geneID(name, 'lis'),
  {
    name,
    family: '',
    fmin,
    fmax,
    strand: 1,
    chromosome: 'Gm01',
    source: 'lis',
  },
];

describe('macroSyntenyReport', () => {
  // two vulgaris targets overlap on g2-g3: covered g0-g3 (4), spanned 6
  const blocks = [
    target('Pv01', 'vulgaris', [{ i: 0, j: 3, metric: 0.2 }]),
    target('Pv02', 'vulgaris', [{ i: 2, j: 3 }]),
    target('Pa01', 'acutifolius', [{ i: 4, j: 5 }]),
  ];
  const genes = new Map([gene('g0', 100, 150), gene('g3', 400, 450)]);

  it('summarizes coverage and depth per target species', () => {
    const report = macroSyntenyReport(query, blocks, genes, 10);
    expect(report.summary).toEqual({
      targets: 3,
      blocks: 3,
      bySpecies: [
        {
          genus: 'Phaseolus',
          species: 'vulgaris',
          targets: 2,
          blocks: 2,
          queryGenesCovered: 4,
          meanDepth: 1.5,
        },
        {
          genus: 'Phaseolus',
          species: 'acutifolius',
          targets: 1,
          blocks: 1,
          queryGenesCovered: 2,
          meanDepth: 1,
        },
      ],
    });
  });

  it('reports block spans on the query and the target', () => {
    const [first] = macroSyntenyReport(query, blocks, genes, 10).targets;
    expect(first.blocks).toEqual([
      {
        orientation: '+',
        query: {
          startGene: 'g0',
          stopGene: 'g3',
          genes: 4,
          fmin: 100,
          fmax: 450,
        },
        target: { fmin: 0, fmax: 30 },
        jaccardDistance: 0.2,
      },
    ]);
  });

  it('leaves out query coordinates whose genes are not loaded', () => {
    const report = macroSyntenyReport(query, blocks, genes, 10);
    expect(report.targets[2].blocks[0].query.fmin).toBeUndefined();
  });

  it('truncates targets but counts them all', () => {
    const report = macroSyntenyReport(query, blocks, genes, 1);
    expect(report.targets.map((t) => t.chromosome)).toEqual(['Pv01']);
    expect(report.truncated).toBe(true);
    expect(report.summary.targets).toBe(3);
  });
});

describe('blockEndpointGenes', () => {
  it("lists each block's first and last query gene once", () => {
    const blocks = [
      target('Pv01', 'vulgaris', [{ i: 0, j: 3 }]),
      target('Pv02', 'vulgaris', [{ i: 3, j: 5 }]),
    ];
    expect(blockEndpointGenes(query, blocks).sort()).toEqual([
      'g0',
      'g3',
      'g5',
    ]);
  });
});
