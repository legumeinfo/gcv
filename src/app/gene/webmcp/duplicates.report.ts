// Tracks of a view that may be one locus twice: a data source can hold a
// genome in several assemblies or annotations, and each shows the locus as
// its own track, so counting tracks would count copies that aren't there.
// Two tracks of one genome (source, genus and species with its strain) on
// differently named chromosomes may be one locus when most of their genes
// share names apart from the assembly and annotation prefix, or when their
// chromosomes share a name apart from the prefix and their spans overlap. A
// new assembly can reuse a name for another locus, so these are pairs to
// check, not conclusions.
import { ClusterAlignment, TrackAlignment } from './alignment.report';

export type SameLocus = {
  evidence: ('gene names' | 'coordinates')[];
  tracks: {
    cluster: number;
    role: 'query' | 'result';
    chromosome: string;
    fmin?: number;
    fmax?: number;
  }[];
};

// a name without its assembly and annotation prefix, e.g. Vigun01g059200
const bareName = (name: string) => name.slice(name.lastIndexOf('.') + 1);

function sharedNames(a: TrackAlignment, b: TrackAlignment): boolean {
  const names = new Set(a.genes.map((g) => bareName(g.name)));
  const shared = b.genes.filter((g) => names.has(bareName(g.name))).length;
  return shared * 2 >= Math.min(a.genes.length, b.genes.length);
}

function overlapping(a: TrackAlignment, b: TrackAlignment): boolean {
  if (
    bareName(a.chromosome) !== bareName(b.chromosome) ||
    a.fmin === undefined ||
    b.fmin === undefined
  ) {
    return false;
  }
  const overlap = Math.min(a.fmax, b.fmax) - Math.max(a.fmin, b.fmin);
  const shorter = Math.min(a.fmax - a.fmin, b.fmax - b.fmin);
  return overlap > 0 && overlap * 2 >= shorter;
}

export function sameLocusTracks(clusters: ClusterAlignment[]): SameLocus[] {
  const tracks = clusters.flatMap(({ cluster, tracks }) =>
    tracks.map((track) => ({ cluster, track })),
  );
  const genome = ({ track }: (typeof tracks)[number]) =>
    `${track.source}\t${track.genus}\t${track.species}`;
  const pairs: SameLocus[] = [];
  tracks.forEach((a, i) =>
    tracks.slice(i + 1).forEach((b) => {
      if (
        genome(a) !== genome(b) ||
        a.track.chromosome === b.track.chromosome
      ) {
        return;
      }
      const evidence: SameLocus['evidence'] = [];
      if (sharedNames(a.track, b.track)) evidence.push('gene names');
      if (overlapping(a.track, b.track)) evidence.push('coordinates');
      if (evidence.length > 0) {
        pairs.push({
          evidence,
          tracks: [a, b].map(({ cluster, track }) => ({
            cluster,
            role: track.role,
            chromosome: track.chromosome,
            fmin: track.fmin,
            fmax: track.fmax,
          })),
        });
      }
    }),
  );
  return pairs;
}
