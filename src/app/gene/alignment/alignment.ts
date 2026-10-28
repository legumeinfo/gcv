// The micro-synteny alignment as data: each cluster's consensus and, for every
// track, which consensus column each gene aligned to. Genes in the same column
// correspond positionally across tracks, which is what the viewer draws as
// vertically aligned genes. The aligners place a gene inserted between two
// columns at a fractional position between them (see GCV.alignment.repeat);
// such a gene corresponds to no column. Agents' reports, annotations and
// figures all resolve against this model.
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { Gene, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';

export type AlignedTrack = Track & ClusterMixin & AlignmentMixin;

type Orientation = '+' | '-' | null;

export type AlignedGene = {
  name: string;
  family: string;
  // the consensus column the gene aligned to
  column: number | null;
  // for a gene inserted between columns, the column it follows
  insertedAfter?: number;
  // alignment direction relative to the consensus (null when outside the
  // alignment)
  orientation: Orientation;
  // genomic strand and coordinates, when the gene has loaded
  strand?: number;
  fmin?: number;
  fmax?: number;
};

export type TrackAlignment = {
  role: 'query' | 'result';
  source: string;
  genus: string;
  species: string;
  chromosome: string;
  // the result track's alignment score; null for query tracks
  score: number | null;
  fmin?: number;
  fmax?: number;
  summary: {
    genes: number;
    aligned: number;
    inserted: number;
    familyMatches: number;
    inverted: number;
    segments: number;
    consensusCoverage: number;
    support: TrackSupport;
  };
  genes: AlignedGene[];
};

// How much a track's matches say. A family with several copies in the
// consensus or the track (a tandem array, a large family) is shared by many
// regions, so matching it says little; a family with one copy in each is the
// strongest evidence of shared ancestry.
export type TrackSupport = {
  // distinct families among the genes that matched the consensus
  familiesMatched: number;
  // those with one copy in the consensus and one in the track
  singleCopyFamiliesMatched: number;
  // genes from the first matching gene to the last
  spanGenes: number;
  // most genes between two successive matching genes
  largestGap: number;
};

export type ClusterAlignment = {
  cluster: number;
  consensus: string[];
  tracks: TrackAlignment[];
};

const orientation = (o: number | null): Orientation =>
  o === 1 ? '+' : o === -1 ? '-' : null;

function trackSupport(
  genes: AlignedGene[],
  matching: AlignedGene[],
  consensus: string[],
): TrackSupport {
  const copies = (families: string[]) => {
    const counts = new Map<string, number>();
    families.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1));
    return counts;
  };
  const inConsensus = copies(consensus);
  const inTrack = copies(genes.map((g) => g.family));
  const families = new Set(matching.map((g) => g.family));
  const positions = matching.map((g) => genes.indexOf(g));
  const gaps = positions.slice(1).map((p, i) => p - positions[i] - 1);
  return {
    familiesMatched: families.size,
    singleCopyFamiliesMatched: [...families].filter(
      (f) => inConsensus.get(f) === 1 && inTrack.get(f) === 1,
    ).length,
    spanGenes:
      positions.length === 0
        ? 0
        : positions[positions.length - 1] - positions[0] + 1,
    largestGap: Math.max(0, ...gaps),
  };
}

export function trackAlignment(
  track: AlignedTrack,
  role: 'query' | 'result',
  consensus: string[],
  genes: Map<string, Gene>,
): TrackAlignment {
  const alignedGenes: AlignedGene[] = track.genes.map((name, i) => {
    const position = track.alignment[i] ?? null;
    const inserted = position !== null && !Number.isInteger(position);
    const gene: AlignedGene = {
      name,
      family: track.families[i],
      column: inserted ? null : position,
      orientation:
        position === null ? null : orientation(track.orientations[i]),
    };
    if (inserted) {
      gene.insertedAfter = Math.floor(position);
    }
    const loaded = genes.get(geneID(name, track.source));
    if (loaded !== undefined) {
      gene.strand = loaded.strand;
      gene.fmin = loaded.fmin;
      gene.fmax = loaded.fmax;
    }
    return gene;
  });
  const aligned = alignedGenes.filter((g) => g.column !== null);
  const columns = new Set(aligned.map((g) => g.column));
  const segments = new Set(
    track.segments.filter((s, i) => s !== null && track.alignment[i] !== null),
  );
  const located = alignedGenes.filter((g) => g.fmin !== undefined);
  const matching = aligned.filter(
    (g) => g.family !== '' && g.family === consensus[g.column],
  );
  const report: TrackAlignment = {
    role,
    source: track.source,
    genus: track.genus,
    species: track.species,
    chromosome: track.name,
    score: role === 'result' ? track.score : null,
    summary: {
      genes: alignedGenes.length,
      aligned: aligned.length,
      inserted: alignedGenes.filter((g) => g.insertedAfter !== undefined)
        .length,
      familyMatches: matching.length,
      inverted: aligned.filter((g) => g.orientation === '-').length,
      segments: segments.size,
      consensusCoverage:
        consensus.length === 0
          ? 0
          : Math.round((columns.size / consensus.length) * 1000) / 1000,
      support: trackSupport(alignedGenes, matching, consensus),
    },
    genes: alignedGenes,
  };
  if (located.length > 0) {
    report.fmin = Math.min(...located.map((g) => g.fmin));
    report.fmax = Math.max(...located.map((g) => g.fmax));
  }
  return report;
}

// tracks are reported in the viewer's order, query tracks first
export function clusterAlignments(
  consensuses: string[][],
  tracks: AlignedTrack[],
  queryTracks: Set<AlignedTrack>,
  genes: Map<string, Gene>,
): ClusterAlignment[] {
  const clusters = Array.from(new Set(tracks.map((t) => t.cluster))).sort(
    (a, b) => a - b,
  );
  return clusters.map((cluster) => {
    const consensus = consensuses[cluster] ?? [];
    return {
      cluster,
      consensus,
      tracks: tracks
        .filter((t) => t.cluster === cluster)
        .map((t) =>
          trackAlignment(
            t,
            queryTracks.has(t) ? 'query' : 'result',
            consensus,
            genes,
          ),
        ),
    };
  });
}
