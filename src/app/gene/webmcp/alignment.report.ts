// Agents' reports of the micro-synteny alignment: a cluster as a table, and
// the genes that correspond to a gene across tracks.
import { AlignedGene, ClusterAlignment } from '@gcv/gene/alignment';

const tsvCell = (value: string | number | null): string =>
  String(value ?? '').replace(/[\t\n\r]/g, ' ');

// One row per track and one column per consensus position; a cell holds the
// gene aligned there, then any genes inserted after it prefixed "+", each
// suffixed " (-)" when aligned inverted. The second row holds the consensus
// families.
export function clusterAlignmentTsv(cluster: ClusterAlignment): string {
  const meta = [
    'cluster',
    'role',
    'source',
    'genus',
    'species',
    'chromosome',
    'score',
  ];
  // a cluster without shared families has an empty consensus but still aligns
  // each track to itself
  const width = Math.max(
    cluster.consensus.length,
    ...cluster.tracks.flatMap((t) =>
      t.genes.map((g) => (g.column ?? g.insertedAfter ?? -1) + 1),
    ),
  );
  const columns = Array.from({ length: width }, (_, i) => `c${i}`);
  const consensus = columns.map((_, i) => cluster.consensus[i] ?? '');
  const rows = [
    [...meta, ...columns],
    [cluster.cluster, 'consensus', '', '', '', '', '', ...consensus],
  ];
  cluster.tracks.forEach((t) => {
    const cells: string[][] = columns.map(() => []);
    const label = (g: AlignedGene) =>
      g.orientation === '-' ? `${g.name} (-)` : g.name;
    t.genes
      .filter((g) => g.column !== null)
      .forEach((g) => cells[g.column].push(label(g)));
    t.genes
      .filter((g) => g.insertedAfter !== undefined)
      .forEach((g) => cells[g.insertedAfter].push(`+${label(g)}`));
    rows.push([
      cluster.cluster,
      t.role,
      t.source,
      t.genus,
      t.species,
      t.chromosome,
      t.score,
      ...cells.map((c) => c.join(';')),
    ]);
  });
  return rows.map((r) => r.map(tsvCell).join('\t')).join('\n');
}

export type Counterpart = {
  role: 'query' | 'result';
  source: string;
  genus: string;
  species: string;
  chromosome: string;
  gene: string;
  family: string;
  sameFamily: boolean;
  // whether the two genes align in the same direction relative to the
  // consensus, i.e. sit in collinear rather than inverted context
  relativeOrientation: 'same' | 'opposite' | null;
  strand?: number;
  fmin?: number;
  fmax?: number;
};

export type GeneOccurrence = {
  cluster: number;
  role: 'query' | 'result';
  source: string;
  genus: string;
  species: string;
  chromosome: string;
  column: number | null;
  insertedAfter?: number;
  consensusFamily: string | null;
  family: string;
  counterparts: Counterpart[];
};

// Every place the gene appears in the alignment, with the genes that align to
// the same consensus column in every other track.
export function syntenicCounterparts(
  clusters: ClusterAlignment[],
  name: string,
  source?: string,
): GeneOccurrence[] {
  const occurrences: GeneOccurrence[] = [];
  clusters.forEach((cluster) => {
    cluster.tracks.forEach((track) => {
      if (source !== undefined && track.source !== source) {
        return;
      }
      track.genes
        .filter((g) => g.name === name)
        .forEach((gene) => {
          const counterparts: Counterpart[] = [];
          if (gene.column !== null) {
            cluster.tracks
              .filter((other) => other !== track)
              .forEach((other) => {
                other.genes
                  .filter((g) => g.column === gene.column)
                  .forEach((g) => {
                    counterparts.push({
                      role: other.role,
                      source: other.source,
                      genus: other.genus,
                      species: other.species,
                      chromosome: other.chromosome,
                      gene: g.name,
                      family: g.family,
                      sameFamily: g.family !== '' && g.family === gene.family,
                      relativeOrientation:
                        g.orientation === null || gene.orientation === null
                          ? null
                          : g.orientation === gene.orientation
                            ? 'same'
                            : 'opposite',
                      strand: g.strand,
                      fmin: g.fmin,
                      fmax: g.fmax,
                    });
                  });
              });
          }
          occurrences.push({
            cluster: cluster.cluster,
            role: track.role,
            source: track.source,
            genus: track.genus,
            species: track.species,
            chromosome: track.chromosome,
            column: gene.column,
            insertedAfter: gene.insertedAfter,
            consensusFamily:
              gene.column === null
                ? null
                : (cluster.consensus[gene.column] ?? null),
            family: gene.family,
            counterparts,
          });
        });
    });
  });
  return occurrences;
}
