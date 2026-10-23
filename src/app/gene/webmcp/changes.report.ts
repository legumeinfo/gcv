// Which result tracks a parameter change added and removed, so an agent can
// tell the matches that hold across parameters from those one setting admits.
// A track before and one after are the same region when they share a gene on
// the same chromosome of the same source: changing the neighborhood changes a
// track's genes, and reclustering can renumber its cluster.
import { ClusterAlignment, TrackAlignment } from './alignment.report';

export type ChangedTrack = {
  cluster: number;
  source: string;
  genus: string;
  species: string;
  chromosome: string;
  fmin?: number;
  fmax?: number;
  score: number;
  familyMatches: number;
  segments: number;
};

export type TrackChanges = {
  before: number;
  after: number;
  kept: number;
  added: ChangedTrack[];
  removed: ChangedTrack[];
  omittedAdded: number;
  omittedRemoved: number;
};

type ResultTrack = { cluster: number; track: TrackAlignment };

const resultTracks = (clusters: ClusterAlignment[]): ResultTrack[] =>
  clusters.flatMap(({ cluster, tracks }) =>
    tracks
      .filter((t) => t.role === 'result')
      .map((track) => ({ cluster, track })),
  );

const region = (t: TrackAlignment) => `${t.source}\t${t.chromosome}`;

// result tracks by region, as their gene sets
function regions(tracks: ResultTrack[]): Map<string, Set<string>[]> {
  const byRegion = new Map<string, Set<string>[]>();
  tracks.forEach(({ track }) => {
    const genes = new Set(track.genes.map((g) => g.name));
    byRegion.set(region(track), [
      ...(byRegion.get(region(track)) ?? []),
      genes,
    ]);
  });
  return byRegion;
}

// the tracks with no counterpart among the others, in view order
function unmatched(
  tracks: ResultTrack[],
  others: ResultTrack[],
): ResultTrack[] {
  const byRegion = regions(others);
  return tracks.filter(
    ({ track }) =>
      !(byRegion.get(region(track)) ?? []).some((genes) =>
        track.genes.some((g) => genes.has(g.name)),
      ),
  );
}

function changedTrack({ cluster, track }: ResultTrack): ChangedTrack {
  const changed: ChangedTrack = {
    cluster,
    source: track.source,
    genus: track.genus,
    species: track.species,
    chromosome: track.chromosome,
    score: track.score,
    familyMatches: track.summary.familyMatches,
    segments: track.summary.segments,
  };
  if (track.fmin !== undefined) {
    changed.fmin = track.fmin;
    changed.fmax = track.fmax;
  }
  return changed;
}

// reports at most maxTracks added and removed tracks each
export function trackChanges(
  before: ClusterAlignment[],
  after: ClusterAlignment[],
  maxTracks: number,
): TrackChanges {
  const old = resultTracks(before);
  const now = resultTracks(after);
  const added = unmatched(now, old);
  const removed = unmatched(old, now);
  return {
    before: old.length,
    after: now.length,
    kept: now.length - added.length,
    added: added.slice(0, maxTracks).map(changedTrack),
    removed: removed.slice(0, maxTracks).map(changedTrack),
    omittedAdded: Math.max(0, added.length - maxTracks),
    omittedRemoved: Math.max(0, removed.length - maxTracks),
  };
}
