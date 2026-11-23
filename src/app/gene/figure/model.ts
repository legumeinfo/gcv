// Builds a micro-synteny figure from a cluster of the view and the figure's
// spec: which tracks it keeps and in what order, which columns it shows,
// how each gene is colored, and notes on everything the spec asked for that
// the figure couldn't do. Every choice here is a claim the figure makes, so
// the rules are strict: a track label spans exactly the genes drawn, a
// family's color is never shared, and tracks are merged only when two kinds
// of evidence say they are one locus, or the user says so.
import type {
  FigureGene,
  FigureLegendEntry,
  FigureRail,
  FigureTrack,
  MicroFigure,
} from '@gcv-assets/js/gcv/visualization/figure/micro-figure.model';
import {
  ClusterAlignment,
  DrawnTrack,
  SameLocus,
  TrackAlignment,
  matchGeneName,
} from '@gcv/gene/alignment';
import { ParsedFigureSpec, PinParams } from '@gcv/gene/models/params';
import { HOLLOW, NEUTRAL, PALETTE } from './palette';

export type FigureInputs = {
  // the cluster's tracks as drawn, and as aligned, in the same order
  drawn: DrawnTrack[];
  alignment: ClusterAlignment;
  sameLocus: SameLocus[];
  spec: ParsedFigureSpec;
  pins: PinParams;
};

export const FIGURE_DEFAULTS = { w: 180, font: 7 };

// what the figure shows, for its caption, its notes and agents
export type FigureManifest = {
  cluster: number;
  resultTracks: { shown: number; of: number };
  tracks: {
    role: 'query' | 'result';
    source: string;
    genus: string;
    species: string;
    chromosome: string;
    fmin: number;
    fmax: number;
    genes: number;
    score: number | null;
    mergedWith?: string;
  }[];
  columns: { from: number; to: number; crop?: [string, string] };
  colours: { family: string; colour: string | null; key: number }[];
  pinned: { genes: string[]; families: string[] };
};

export type FigureModel = {
  figure: Omit<MicroFigure, 'caption' | 'metadata'>;
  manifest: FigureManifest;
  notes: string[];
};

type Track = { drawn: DrawnTrack; aligned: TrackAlignment };

// LIS names begin with the species and strain, which the label shows, then
// the assembly and annotation: glyma.Wm82.gnm4.ann1.Glyma.09G134900 is gene
// Glyma.09G134900, and glyma.Wm82.gnm4.Gm09 chromosome Gm09 of assembly gnm4
const LIS_GENE = /^[a-z0-9]+\.[^.]+\.gnm\d+\.ann\d+\.(.+)$/;
const LIS_CHROMOSOME = /^[a-z0-9]+\.[^.]+\.gnm\d+\.(.+)$/;
const LIS_ASSEMBLY_CHROMOSOME = /^[a-z0-9]+\.[^.]+\.(gnm\d+\..+)$/;
const shortName = (name: string, pattern: RegExp) =>
  name.match(pattern)?.[1] ?? name;

const position = (n: number) => n.toLocaleString('en-US');

const unique = <T>(items: T[]) => Array.from(new Set(items));

function chooseTracks(
  tracks: Track[],
  spec: ParsedFigureSpec,
  notes: string[],
): Track[] {
  const results = tracks.filter((t) => t.aligned.role === 'result');
  if (spec.tracks !== undefined) {
    const chosen: Track[] = [];
    spec.tracks.forEach((gene) => {
      const holders = results.filter(
        (t) =>
          matchGeneName(
            t.aligned.genes.map((g) => g.name),
            gene,
          ).length > 0,
      );
      if (holders.length === 0) {
        notes.push(`No result track has the gene ${gene}.`);
      }
      chosen.push(...holders);
    });
    return unique(chosen);
  }
  let kept = results;
  if (spec.genus !== undefined) {
    kept = kept.filter((t) => spec.genus.includes(t.aligned.genus));
  }
  if (spec.top !== undefined) {
    kept = [...kept]
      .sort((a, b) => (b.aligned.score ?? 0) - (a.aligned.score ?? 0))
      .slice(0, spec.top);
    // keep the view's order among the best
    kept = results.filter((t) => kept.includes(t));
  }
  return kept;
}

function orderTracks(results: Track[], spec: ParsedFigureSpec): Track[] {
  const order = spec.order ?? 'view';
  if (order === 'view') return results;
  if (order === 'score') {
    return [...results].sort(
      (a, b) => (b.aligned.score ?? 0) - (a.aligned.score ?? 0),
    );
  }
  const rank = (t: Track) => {
    const i = order.genera.indexOf(t.aligned.genus);
    return i === -1 ? order.genera.length : i;
  };
  // a stable sort keeps the view's order within a genus
  return [...results].sort((a, b) => rank(a) - rank(b));
}

// pairs of kept tracks to merge, as [kept, dropped]
function mergePairs(
  kept: Track[],
  inputs: FigureInputs,
  notes: string[],
): [Track, Track][] {
  const { spec, sameLocus } = inputs;
  if (spec.merge === undefined) return [];
  const find = (t: SameLocus['tracks'][number]) =>
    kept.find(
      (k) =>
        k.aligned.chromosome === t.chromosome &&
        k.aligned.fmin === t.fmin &&
        k.aligned.fmax === t.fmax,
    );
  let pairs: [Track, Track][] = [];
  if (spec.merge === 'both') {
    pairs = sameLocus
      .filter((p) => p.evidence.length === 2)
      .map((p) => [find(p.tracks[0]), find(p.tracks[1])] as [Track, Track])
      .filter(([a, b]) => a !== undefined && b !== undefined);
  } else {
    const holder = (gene: string) =>
      kept.filter(
        (t) =>
          matchGeneName(
            t.aligned.genes.map((g) => g.name),
            gene,
          ).length > 0,
      );
    spec.merge.forEach(([g1, g2]) => {
      const [a, b] = [holder(g1), holder(g2)];
      if (a.length !== 1 || b.length !== 1 || a[0] === b[0]) {
        notes.push(
          `Not merged: ${g1} and ${g2} must each be in exactly one shown track, and in different tracks.`,
        );
        return;
      }
      pairs.push([a[0], b[0]]);
    });
  }
  // keep the query track, or else the track with more aligned genes
  return pairs.map(([a, b]) => {
    const keepA =
      a.aligned.role === 'query' ||
      (b.aligned.role !== 'query' &&
        a.aligned.summary.aligned >= b.aligned.summary.aligned);
    return keepA ? [a, b] : [b, a];
  });
}

// the columns shown, as the drawn range, and the crop's ends when it applied
function columnRange(
  kept: Track[],
  spec: ParsedFigureSpec,
  notes: string[],
): { range: [number, number]; crop?: [string, string] } {
  const xs = kept.flatMap((t) => t.drawn.genes.map((g) => g.x));
  const all: [number, number] = [Math.min(...xs) - 0.5, Math.max(...xs) + 0.5];
  if (spec.crop === undefined) return { range: all };
  // an end's column, from a query track where it can
  const column = (gene: string): number | undefined => {
    const ordered = [
      ...kept.filter((t) => t.aligned.role === 'query'),
      ...kept.filter((t) => t.aligned.role !== 'query'),
    ];
    for (const t of ordered) {
      const [name] = matchGeneName(
        t.aligned.genes.map((g) => g.name),
        gene,
      );
      const found = t.aligned.genes.find((g) => g.name === name);
      if (found?.column != null) return found.column;
    }
    return undefined;
  };
  const ends = spec.crop.map(column);
  if (ends.some((e) => e === undefined)) {
    notes.push(
      `Not cropped: ${spec.crop.filter((_, i) => ends[i] === undefined).join(' and ')} must be a shown gene in a consensus column.`,
    );
    return { range: all };
  }
  const [a, b] = [Math.min(...ends), Math.max(...ends)];
  return { range: [a - 0.5, b + 0.5], crop: spec.crop };
}

export function figureModel(inputs: FigureInputs): FigureModel {
  const { drawn, alignment, spec, pins } = inputs;
  const notes: string[] = [];
  if (spec.rejected !== undefined) {
    notes.push(
      `The figure's parameter had unreadable parts, left out: ${spec.rejected.join('; ')}.`,
    );
  }
  const tracks: Track[] = drawn.map((d, i) => ({
    drawn: d,
    aligned: alignment.tracks[i],
  }));
  const queries = tracks.filter((t) => t.aligned.role === 'query');
  const allResults = tracks.length - queries.length;
  const results = orderTracks(chooseTracks(tracks, spec, notes), spec);
  let kept = [...queries, ...results];

  const merges = mergePairs(kept, inputs, notes);
  const mergedWith = new Map<Track, Track>();
  merges.forEach(([keep, drop]) => {
    if (kept.includes(keep) && kept.includes(drop)) {
      mergedWith.set(keep, drop);
      kept = kept.filter((t) => t !== drop);
    }
  });

  const { range, crop } = columnRange(kept, spec, notes);
  const inRange = (x: number) => x >= range[0] && x <= range[1];

  // the families' genes among the genes shown
  const shownGenes = kept.flatMap((t) =>
    t.drawn.genes.filter((g) => inRange(g.x)),
  );
  const counts = new Map<string, number>();
  shownGenes
    .filter((g) => g.family !== '')
    .forEach((g) => counts.set(g.family, (counts.get(g.family) ?? 0) + 1));
  const matched = (f: string) => (counts.get(f) ?? 0) > 1;
  // a stable order: the first column a family appears in, then its ID
  const firstColumn = new Map<string, number>();
  shownGenes.forEach((g) =>
    firstColumn.set(
      g.family,
      Math.min(firstColumn.get(g.family) ?? Infinity, g.x),
    ),
  );
  const stable = (families: string[]) =>
    unique(families).sort(
      (a, b) => firstColumn.get(a) - firstColumn.get(b) || a.localeCompare(b),
    );

  let requested: string[];
  if (spec.colour !== undefined) {
    spec.colour
      .filter((f) => !counts.has(f))
      .forEach((f) =>
        notes.push(`Not colored: family ${f} has no gene in the figure.`),
      );
    spec.colour
      .filter((f) => counts.get(f) === 1)
      .forEach((f) =>
        notes.push(
          `Not colored: family ${f} has no other gene in the figure, so it is drawn hollow.`,
        ),
      );
    requested = stable(spec.colour.filter(matched));
  } else {
    // by default, as many as have distinct colors
    requested = stable(
      kept
        .filter((t) => t.aligned.role === 'query')
        .flatMap((t) =>
          t.drawn.genes.filter((g) => inRange(g.x)).map((g) => g.family),
        )
        .filter((f) => f !== '' && matched(f)),
    ).slice(0, PALETTE.length);
  }
  const keys = new Map(requested.map((f, i) => [f, i + 1]));
  const colourOf = new Map(
    requested.slice(0, PALETTE.length).map((f, i) => [f, PALETTE[i]]),
  );
  const uncoloured = requested.slice(PALETTE.length);
  const famlabels = spec.famlabels ?? false;
  if (uncoloured.length > 0) {
    notes.push(
      `Only ${PALETTE.length} families can have distinct colors; ${uncoloured.join(', ')} ${uncoloured.length === 1 ? 'is' : 'are'} drawn grey` +
        (famlabels
          ? ', with their legend numbers.'
          : '. Turn on family numbers (famlabels) to tell them apart, or color fewer families.'),
    );
  }

  const pinnedGenes = new Set(pins.pingene);
  const pinnedFamilies = new Set(pins.pinfam);
  let missingCoordinates = false;
  const figureTracks: FigureTrack[] = [];
  const manifestTracks: FigureManifest['tracks'] = [];
  kept.forEach((t) => {
    const all = t.drawn.genes;
    const shown = all.filter((g) => inRange(g.x));
    if (shown.length === 0) {
      notes.push(
        `Left out ${t.aligned.chromosome}: none of its genes are in the columns shown.`,
      );
      return;
    }
    // rows renumbered from the top, so rows left empty by the crop close up
    const rows = unique(shown.map((g) => g.y)).sort((a, b) => a - b);
    const genes: FigureGene[] = shown.map((g) => {
      let style: FigureGene['style'] = 'neutral';
      let fill = NEUTRAL;
      if (g.family === '') {
        style = 'orphan';
        fill = HOLLOW;
      } else if (!matched(g.family)) {
        style = 'hollow';
        fill = HOLLOW;
      } else if (colourOf.has(g.family)) {
        style = 'colour';
        fill = colourOf.get(g.family);
      }
      if (g.fmin === 0 && g.fmax === 0) missingCoordinates = true;
      return {
        name: g.name,
        label: shortName(g.name, LIS_GENE),
        family: g.family,
        x: g.x,
        y: rows.indexOf(g.y),
        fmin: g.fmin,
        fmax: g.fmax,
        strand: g.strand,
        glyph: g.glyph,
        style,
        fill,
        key: keys.get(g.family),
        pinned: pinnedGenes.has(g.name) || pinnedFamilies.has(g.family),
      };
    });
    // rails join consecutive genes; one whose neighbor isn't shown ends at
    // the figure's edge on the neighbor's side
    const rails: FigureRail[] = [];
    all.slice(1).forEach((next, j) => {
      const prev = all[j];
      const [a, b] = [shown.indexOf(prev), shown.indexOf(next)];
      const ends: FigureRail['ends'] = [
        { fmin: prev.fmin, fmax: prev.fmax },
        { fmin: next.fmin, fmax: next.fmax },
      ];
      const side = (x: number) => (x < range[0] ? 'left' : 'right');
      if (a !== -1 && b !== -1) rails.push({ from: a, to: b, ends });
      else if (a !== -1) rails.push({ from: a, to: side(next.x), ends });
      else if (b !== -1) rails.push({ from: b, to: side(prev.x), ends });
    });
    const fmin = Math.min(...shown.map((g) => g.fmin));
    const fmax = Math.max(...shown.map((g) => g.fmax));
    const other = mergedWith.get(t);
    const chromosome = t.aligned.chromosome;
    const short = spec.labels === 'short';
    const name = (c: string) =>
      short
        ? shortName(c, LIS_CHROMOSOME)
        : shortName(c, LIS_ASSEMBLY_CHROMOSOME);
    let locus = short
      ? name(chromosome)
      : `${name(chromosome)}:${position(fmin)}–${position(fmax)}`;
    if (other !== undefined) {
      locus += ` = ${name(other.aligned.chromosome)}`;
    }
    // GCV's species can carry the strain, which isn't italicized
    const [species, strain] = t.aligned.species.split(':');
    figureTracks.push({
      role: t.aligned.role,
      binomial: `${t.aligned.genus} ${species}`,
      locus: strain === undefined ? locus : `${strain} ${locus}`,
      genes,
      rails,
    });
    manifestTracks.push({
      role: t.aligned.role,
      source: t.aligned.source,
      genus: t.aligned.genus,
      species: t.aligned.species,
      chromosome,
      fmin,
      fmax,
      genes: shown.length,
      score: t.aligned.score,
      ...(other !== undefined ? { mergedWith: other.aligned.chromosome } : {}),
    });
  });
  if (missingCoordinates) {
    notes.push(
      "Some genes' coordinates haven't loaded, so their tracks' spans are incomplete; wait for the view to finish loading.",
    );
  }

  const figureGenes = figureTracks.flatMap((t) => t.genes);
  const has = (style: FigureGene['style']) =>
    figureGenes.some((g) => g.style === style);
  const legend: FigureLegendEntry[] = [
    ...requested.map((family) => ({
      style: (colourOf.has(family)
        ? 'colour'
        : 'neutral') as FigureGene['style'],
      fill: colourOf.get(family) ?? NEUTRAL,
      key: famlabels ? keys.get(family) : undefined,
      label: family,
    })),
    ...(figureGenes.some((g) => g.style === 'neutral' && !keys.has(g.family))
      ? [
          {
            style: 'neutral' as const,
            fill: NEUTRAL,
            label: 'other families with genes in several tracks',
          },
        ]
      : []),
    ...(has('hollow')
      ? [
          {
            style: 'hollow' as const,
            fill: HOLLOW,
            label: 'no other gene of its family in the figure',
          },
        ]
      : []),
    ...(has('orphan')
      ? [{ style: 'orphan' as const, fill: HOLLOW, label: 'no gene family' }]
      : []),
  ];

  return {
    figure: {
      columns: range,
      tracks: figureTracks,
      legend: spec.legend === false ? null : legend,
      size: {
        width: spec.w ?? FIGURE_DEFAULTS.w,
        font: spec.font ?? FIGURE_DEFAULTS.font,
        glyph: spec.glyph,
      },
      names: spec.names ?? false,
      famlabels,
      printCaption: spec.cap ?? false,
    },
    manifest: {
      cluster: alignment.cluster,
      resultTracks: {
        shown: manifestTracks.filter((t) => t.role === 'result').length,
        of: allResults,
      },
      tracks: manifestTracks,
      columns: {
        from: range[0] + 0.5,
        to: range[1] - 0.5,
        ...(crop !== undefined ? { crop } : {}),
      },
      colours: requested.map((family) => ({
        family,
        colour: colourOf.get(family) ?? null,
        key: keys.get(family),
      })),
      pinned: {
        genes: unique(
          figureGenes.filter((g) => pinnedGenes.has(g.name)).map((g) => g.name),
        ),
        families: unique(
          figureGenes
            .filter((g) => pinnedFamilies.has(g.family))
            .map((g) => g.family),
        ),
      },
    },
    notes,
  };
}
