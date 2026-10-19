// Finds what an agent names among the view's genes and tracks. Agents often
// drop the assembly prefix of a name ('Glyma.12G040000' for
// 'glyma.Wm82.gnm4.ann1.Glyma.12G040000'), so a name also matches as the
// suffix of a full name.
import { WebMcpToolError } from '@gcv/core/webmcp/webmcp';
import { clusteredTrackID } from '@gcv/gene/models';
import { AlignedTrack } from './view-state';

const matchesName = (full: string, name: string): boolean => {
  const f = full.toLowerCase();
  const n = name.toLowerCase();
  return f === n || f.endsWith(`.${n}`);
};

// the name itself if present, otherwise every name it is the suffix of
export function matchGeneName(names: Iterable<string>, gene: string): string[] {
  const all = Array.from(new Set(names));
  if (all.includes(gene)) {
    return [gene];
  }
  return all.filter((n) => matchesName(n, gene));
}

export type TrackQuery = {
  chromosome: string;
  cluster?: number;
  gene?: string;
  source?: string;
};

// The tracks on the chromosome, optionally in the cluster, containing the
// gene, and from the source; a track aligned several times counts once.
export function matchTracks(
  tracks: AlignedTrack[],
  { chromosome, cluster, gene, source }: TrackQuery,
): AlignedTrack[] {
  const matches = new Map<string, AlignedTrack>();
  tracks
    .filter(
      (t) =>
        matchesName(t.name, chromosome) &&
        (cluster === undefined || t.cluster === cluster) &&
        (source === undefined || t.source === source) &&
        (gene === undefined || t.genes.some((g) => matchesName(g, gene))),
    )
    .forEach((t) => {
      const id = clusteredTrackID(t);
      if (!matches.has(id)) {
        matches.set(id, t);
      }
    });
  return Array.from(matches.values());
}

// how a track is described to an agent, e.g. to tell ambiguous tracks apart
export function trackLabel(track: AlignedTrack) {
  return {
    cluster: track.cluster,
    chromosome: track.name,
    source: track.source,
    firstGene: track.genes[0],
    lastGene: track.genes[track.genes.length - 1],
  };
}

// the one track the agent names; fails with the candidates otherwise
export function resolveTrack(
  tracks: AlignedTrack[],
  query: TrackQuery,
): AlignedTrack {
  const matches = matchTracks(tracks, query);
  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length === 0) {
    const chromosomes = Array.from(new Set(tracks.map((t) => t.name)));
    throw new WebMcpToolError(
      `No track in the view matches ${JSON.stringify(query)}. Chromosomes in the view: ${chromosomes.slice(0, 50).join(', ')}${chromosomes.length > 50 ? ', …' : ''}.`,
    );
  }
  throw new WebMcpToolError(
    `Several tracks match; add cluster, gene or source to choose one: ${JSON.stringify(matches.map(trackLabel))}`,
  );
}
