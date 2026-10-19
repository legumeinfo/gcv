// The gene families of the micro-synteny view: how many copies of each the
// tracks hold, per track and per species, and how many are in tandem arrays.
// A track's genes are in chromosome order, so adjacent members of a family
// on one track form a tandem array. A track aligned several times counts
// once.
import { trackID } from '@gcv/gene/models';
import { AlignedTrack } from './view-state';

export type FamilyReport = {
  family: string;
  genes: number;
  tracks: number;
  maxCopiesPerTrack: number;
  // runs of two or more adjacent members on one track
  tandemArrays: number;
  // genes per species, 'Genus species'
  bySpecies: Record<string, number>;
  onQueryTrack: boolean;
  // the color the viewers draw the family in; null when they draw it white,
  // as they do a family with one gene in the view
  color: string | null;
  deemphasized: boolean;
};

export type FamilyMembers = {
  family: string;
  tracks: {
    role: 'query' | 'result';
    cluster: number;
    species: string;
    chromosome: string;
    source: string;
    genes: string[];
  }[];
};

export type FamiliesReport = {
  tracks: number;
  species: { species: string; tracks: number }[];
  families: number;
  familyReports: FamilyReport[];
  // families with one gene in the view
  singletons: string[];
  // genes without a family
  orphans: number;
};

const speciesName = (t: AlignedTrack) => `${t.genus} ${t.species}`;

function uniqueTracks(tracks: AlignedTrack[]): AlignedTrack[] {
  const unique = new Map<string, AlignedTrack>();
  tracks.forEach((t) => {
    const id = trackID(t);
    if (!unique.has(id)) {
      unique.set(id, t);
    }
  });
  return Array.from(unique.values());
}

// lengths of the runs of adjacent genes of the family on a track
function runs(track: AlignedTrack, family: string): number[] {
  const lengths: number[] = [];
  let length = 0;
  track.families.forEach((f) => {
    if (f === family) {
      length += 1;
    } else if (length > 0) {
      lengths.push(length);
      length = 0;
    }
  });
  if (length > 0) {
    lengths.push(length);
  }
  return lengths;
}

export function familiesReport(
  tracks: AlignedTrack[],
  queryTracks: AlignedTrack[],
  options: { omitted: string[]; color: (family: string) => string | null },
): FamiliesReport {
  const unique = uniqueTracks(tracks);
  const queryIDs = new Set(queryTracks.map((t) => trackID(t)));
  const omitted = new Set(options.omitted);
  const members = new Map<string, AlignedTrack[]>();
  let orphans = 0;
  unique.forEach((t) =>
    t.families.forEach((f) => {
      if (f === '') {
        orphans += 1;
      } else if (!members.get(f)?.includes(t)) {
        members.set(f, [...(members.get(f) ?? []), t]);
      }
    }),
  );
  const familyReports: FamilyReport[] = [];
  const singletons: string[] = [];
  members.forEach((familyTracks, family) => {
    const copies = familyTracks.map(
      (t) => t.families.filter((f) => f === family).length,
    );
    const genes = copies.reduce((a, b) => a + b, 0);
    if (genes === 1) {
      singletons.push(family);
      return;
    }
    const bySpecies: Record<string, number> = {};
    familyTracks.forEach((t, i) => {
      const species = speciesName(t);
      bySpecies[species] = (bySpecies[species] ?? 0) + copies[i];
    });
    familyReports.push({
      family,
      genes,
      tracks: familyTracks.length,
      maxCopiesPerTrack: Math.max(...copies),
      tandemArrays: familyTracks
        .flatMap((t) => runs(t, family))
        .filter((l) => l > 1).length,
      bySpecies,
      onQueryTrack: familyTracks.some((t) => queryIDs.has(trackID(t))),
      color: options.color(family),
      deemphasized: omitted.has(family),
    });
  });
  familyReports.sort(
    (a, b) => b.genes - a.genes || a.family.localeCompare(b.family),
  );
  const speciesTracks = new Map<string, number>();
  unique.forEach((t) =>
    speciesTracks.set(
      speciesName(t),
      (speciesTracks.get(speciesName(t)) ?? 0) + 1,
    ),
  );
  return {
    tracks: unique.length,
    species: Array.from(speciesTracks, ([species, tracks]) => ({
      species,
      tracks,
    })),
    families: members.size,
    familyReports,
    singletons: singletons.sort(),
    orphans,
  };
}

// the genes of one family on each track that holds it
export function familyMembers(
  tracks: AlignedTrack[],
  queryTracks: AlignedTrack[],
  family: string,
): FamilyMembers {
  const queryIDs = new Set(queryTracks.map((t) => trackID(t)));
  return {
    family,
    tracks: uniqueTracks(tracks)
      .map((t) => ({
        role: queryIDs.has(trackID(t))
          ? ('query' as const)
          : ('result' as const),
        cluster: t.cluster,
        species: speciesName(t),
        chromosome: t.name,
        source: t.source,
        genes: t.genes.filter((g, i) => t.families[i] === family),
      }))
      .filter((t) => t.genes.length > 0),
  };
}
