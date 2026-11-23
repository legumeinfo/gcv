// Places annotations on the view's clusters: each named gene resolves to the
// drawn tracks that hold it and the consensus column it aligned to, every
// time the view draws. An annotation that can't be placed isn't drawn at a
// guessed position; it gets a reason that says how to recover.
import type {
  PlacedAnnotation,
  PlacedSite,
} from '@gcv-assets/js/gcv/visualization/annotations/annotation-marks';
import {
  ClusterAlignment,
  DrawnTrack,
  matchGeneName,
} from '@gcv/gene/alignment';
import { Annotation, GeneRef, annotationID } from './grammar';
import { positionToColumn } from './position';

// a cluster's tracks as drawn and as aligned, in the same order
export type AnnotatedCluster = {
  alignment: ClusterAlignment;
  drawn: DrawnTrack[];
};

export type Placement = PlacedAnnotation & { cluster: number };

export type Unplaced = { id: string; annotation: Annotation; reason: string };

export type Resolution = { placed: Placement[]; unplaced: Unplaced[] };

class Unplaceable extends Error {}

const fail = (reason: string): never => {
  throw new Unplaceable(reason);
};

const show = ({ name, source }: GeneRef) =>
  source === undefined ? name : `${name}@${source}`;

type Occurrence = { track: number; x: number; role: 'query' | 'result' };

// where a gene is drawn in a cluster; [] when it isn't
function occurrences(c: AnnotatedCluster, ref: GeneRef): Occurrence[] {
  const tracks = c.drawn
    .map((d, i) => ({ d, i, role: c.alignment.tracks[i].role }))
    .filter(({ d }) => ref.source === undefined || d.source === ref.source);
  const names = tracks.flatMap(({ d }) => d.genes.map((g) => g.name));
  const matches = matchGeneName(names, ref.name);
  if (matches.length > 1) {
    fail(
      `${show(ref)} names several genes (${matches.join(', ')}); use the full name.`,
    );
  }
  return tracks.flatMap(({ d, i, role }) =>
    d.genes
      .filter((g) => g.name === matches[0])
      .map((g) => ({ track: i, x: g.x, role })),
  );
}

// the consensus column a gene anchors: the query track's when its tracks
// disagree
function column(c: AnnotatedCluster, ref: GeneRef): number {
  const found = occurrences(c, ref);
  if (found.length === 0) {
    fail(
      `${show(ref)} is not in the view; raise neighbors or remove this item.`,
    );
  }
  const aligned = found.filter((o) => Number.isInteger(o.x));
  if (aligned.length === 0) {
    fail(
      `${show(ref)} is inserted between consensus columns, so it can't anchor a column; anchor to a gene beside it.`,
    );
  }
  const columns = new Set(aligned.map((o) => o.x));
  if (columns.size === 1) return aligned[0].x;
  const query = aligned.filter((o) => o.role === 'query');
  if (new Set(query.map((o) => o.x)).size === 1) return query[0].x;
  return fail(
    `${show(ref)} aligns to several columns (${Array.from(columns).join(', ')}); anchor to another gene.`,
  );
}

// the one track that holds a gene
function track(c: AnnotatedCluster, ref: GeneRef): number {
  const tracks = Array.from(new Set(occurrences(c, ref).map((o) => o.track)));
  if (tracks.length === 0) {
    fail(
      `${show(ref)} is not in the view; raise neighbors or remove this item.`,
    );
  }
  if (tracks.length > 1) {
    fail(
      `${show(ref)} is in ${tracks.length} tracks; name a gene that is in only one.`,
    );
  }
  return tracks[0];
}

// the genes an annotation anchors to, which choose its cluster
function anchors(a: Annotation): GeneRef[] {
  switch (a.kind) {
    case 'box':
      return [...a.columns, ...(typeof a.tracks === 'string' ? [] : a.tracks)];
    case 'gap':
      return [a.column, a.track];
    case 'note':
      return 'gene' in a ? [a.gene] : [a.column, a.track];
    case 'head':
      return [...a.columns];
    case 'site':
      return [];
  }
}

function place(
  a: Annotation,
  c: AnnotatedCluster,
): Omit<PlacedAnnotation, 'id'> {
  const base = { kind: a.kind, text: a.text, style: a.style };
  switch (a.kind) {
    case 'box': {
      const ends = a.columns.map((r) => column(c, r));
      const roles = c.alignment.tracks.map((t) => t.role);
      const tracks =
        a.tracks === '*'
          ? roles.map((_, i) => i)
          : a.tracks === 'q'
            ? roles.flatMap((r, i) => (r === 'query' ? [i] : []))
            : a.tracks.map((r) => track(c, r));
      return {
        ...base,
        columns: [Math.min(...ends), Math.max(...ends)],
        tracks,
      };
    }
    case 'gap': {
      const at = column(c, a.column);
      const t = track(c, a.track);
      const there = c.drawn[t].genes.find((g) => g.x === at);
      if (there !== undefined) {
        fail(
          `${show(a.track)}'s track has ${there.name} in that column, so it has no gap there.`,
        );
      }
      return { ...base, column: at, track: t };
    }
    case 'note': {
      if ('gene' in a) {
        const found = occurrences(c, a.gene);
        if (found.length === 0) {
          fail(
            `${show(a.gene)} is not in the view; raise neighbors or remove this item.`,
          );
        }
        // a gene in several tracks is one gene aligned several times
        const at = found.find((o) => o.role === 'query') ?? found[0];
        return { ...base, x: at.x, track: at.track };
      }
      return {
        ...base,
        column: column(c, a.column),
        track: track(c, a.track),
      };
    }
    case 'head': {
      const ends = a.columns.map((r) => column(c, r));
      return { ...base, columns: [Math.min(...ends), Math.max(...ends)] };
    }
    case 'site':
      throw new Error('sites are placed per track');
  }
}

// a site on every drawn track of its chromosome whose span covers it
function placeSites(
  a: Extract<Annotation, { kind: 'site' }>,
  c: AnnotatedCluster,
): PlacedSite[] {
  const { chromosome, start, end = start } = a.at;
  return c.drawn.flatMap((d, i) => {
    if (d.chromosome_name !== chromosome) return [];
    const located = d.genes.filter((g) => !(g.fmin === 0 && g.fmax === 0));
    if (located.length === 0) return [];
    const from = Math.min(...located.map((g) => g.fmin));
    const to = Math.max(...located.map((g) => g.fmax));
    if (end < from || start > to) return [];
    const p0 = positionToColumn(located, start);
    const p1 = positionToColumn(located, end);
    const clipped = p0.clipped ?? p1.clipped;
    return [
      {
        track: i,
        x0: p0.x,
        x1: p1.x,
        ...(clipped !== undefined ? { clipped } : {}),
      },
    ];
  });
}

export function resolveAnnotations(
  annotations: Annotation[],
  clusters: AnnotatedCluster[],
): Resolution {
  const placed: Placement[] = [];
  const unplaced: Unplaced[] = [];
  annotations.forEach((a) => {
    const id = annotationID(a);
    if (a.kind === 'site') {
      const sites = clusters.flatMap((c) => {
        const found = placeSites(a, c);
        return found.length === 0
          ? []
          : [{ cluster: c.alignment.cluster, sites: found }];
      });
      if (sites.length === 0) {
        unplaced.push({
          id,
          annotation: a,
          reason: `No track in the view on ${a.at.chromosome} spans ${a.at.start}${a.at.end === undefined ? '' : `-${a.at.end}`}; a site is drawn only on tracks of its own assembly.`,
        });
      }
      sites.forEach(({ cluster, sites }) =>
        placed.push({
          id,
          cluster,
          kind: 'site',
          text: a.text,
          style: a.style,
          sites,
        }),
      );
      return;
    }
    try {
      // the clusters that draw every anchor, narrowed by cl
      let candidates = clusters.filter((c) =>
        anchors(a).every((r) => occurrences(c, r).length > 0),
      );
      if (a.cl !== undefined) {
        candidates = candidates.filter((c) =>
          c.alignment.tracks.some(
            (t) =>
              t.role === 'query' &&
              matchGeneName(
                t.genes.map((g) => g.name),
                a.cl.name,
              ).length > 0,
          ),
        );
      }
      if (candidates.length === 0) {
        const where = anchors(a).map((r) => ({
          r,
          in: clusters
            .filter((c) => occurrences(c, r).length > 0)
            .map((c) => c.alignment.cluster),
        }));
        const missing = where.find((w) => w.in.length === 0);
        if (missing !== undefined) {
          fail(
            `${show(missing.r)} is not in the view; raise neighbors or remove this item.`,
          );
        }
        fail(
          `Its genes are in different clusters (${where.map((w) => `${show(w.r)} in ${w.in.join(', ')}`).join('; ')}); anchor it to genes of one cluster.`,
        );
      }
      if (candidates.length > 1) {
        fail(
          `Its genes are in clusters ${candidates.map((c) => c.alignment.cluster).join(', ')}; add cl with a query gene of the one to use.`,
        );
      }
      const [c] = candidates;
      placed.push({ id, cluster: c.alignment.cluster, ...place(a, c) });
    } catch (error) {
      if (!(error instanceof Unplaceable)) throw error;
      unplaced.push({ id, annotation: a, reason: error.message });
    }
  });
  return { placed, unplaced };
}
