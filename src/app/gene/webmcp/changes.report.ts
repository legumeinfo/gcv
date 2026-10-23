// Which result tracks a parameter change added and removed, and which regions
// several parameterizations find, so an agent can tell the matches that hold
// across parameters from those one setting admits. Tracks of two views are
// the same region when they share a gene on the same chromosome of the same
// source: changing the neighborhood changes a track's genes, and reclustering
// can renumber its cluster.
import {
  ClusterAlignment,
  TrackAlignment,
  TrackSupport,
} from './alignment.report';

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
  support: TrackSupport;
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
    support: track.summary.support,
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

export type RegionPresence = {
  source: string;
  genus: string;
  species: string;
  chromosome: string;
  fmin?: number;
  fmax?: number;
  // the labels of the views that found the region, in view order
  foundIn: string[];
  // per view that found it, its best-supported track there
  support: Record<string, TrackSupport & { score: number }>;
};

export type PresenceReport = {
  regions: RegionPresence[];
  omittedRegions: number;
};

// Groups the result tracks of several views of one query into regions, so the
// views can be compared region by region: tracks are the same region when
// they share a gene on the same chromosome of the same source, in one view or
// across views. Regions found by more views come first, then the better
// supported.
export function regionPresence(
  views: { label: string; clusters: ClusterAlignment[] }[],
  maxRegions: number,
): PresenceReport {
  const tracks = views.flatMap(({ label, clusters }) =>
    resultTracks(clusters).map(({ track }) => ({ label, track })),
  );
  // union-find over the tracks, joined through the genes they share
  const parent = tracks.map((_, i) => i);
  const root = (i: number): number =>
    parent[i] === i ? i : (parent[i] = root(parent[i]));
  const byGene = new Map<string, number>();
  tracks.forEach(({ track }, i) =>
    track.genes.forEach((g) => {
      const key = `${region(track)}\t${g.name}`;
      const other = byGene.get(key);
      if (other === undefined) {
        byGene.set(key, i);
      } else {
        parent[root(other)] = root(i);
      }
    }),
  );
  const groups = new Map<number, number[]>();
  tracks.forEach((_, i) =>
    groups.set(root(i), [...(groups.get(root(i)) ?? []), i]),
  );
  const order = views.map((v) => v.label);
  const regions = [...groups.values()].map((members) => {
    const { track } = tracks[members[0]];
    const support: RegionPresence['support'] = {};
    members.forEach((i) => {
      const { label, track: t } = tracks[i];
      const s = t.summary.support;
      const best = support[label];
      if (
        best === undefined ||
        s.singleCopyFamiliesMatched > best.singleCopyFamiliesMatched
      ) {
        support[label] = { ...s, score: t.score };
      }
    });
    const located = members
      .map((i) => tracks[i].track)
      .filter((t) => t.fmin !== undefined);
    const presence: RegionPresence = {
      source: track.source,
      genus: track.genus,
      species: track.species,
      chromosome: track.chromosome,
      foundIn: order.filter((label) => label in support),
      support: Object.fromEntries(
        order.filter((label) => label in support).map((l) => [l, support[l]]),
      ),
    };
    if (located.length > 0) {
      presence.fmin = Math.min(...located.map((t) => t.fmin));
      presence.fmax = Math.max(...located.map((t) => t.fmax));
    }
    return presence;
  });
  const best = (r: RegionPresence) =>
    Math.max(
      ...Object.values(r.support).map((s) => s.singleCopyFamiliesMatched),
    );
  regions.sort(
    (a, b) => b.foundIn.length - a.foundIn.length || best(b) - best(a),
  );
  return {
    regions: regions.slice(0, maxRegions),
    omittedRegions: Math.max(0, regions.length - maxRegions),
  };
}
