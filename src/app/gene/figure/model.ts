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
  FigureMarks,
  FigureRail,
  FigureTrack,
  MicroFigure,
} from '@gcv-assets/js/gcv/visualization/figure/micro-figure.model';
import {
  ClusterAlignment,
  SameLocus,
  TrackAlignment,
  matchGeneName,
} from '@gcv/gene/alignment';
import { ParsedFigureSpec } from '@gcv/gene/models/params';
import { HOLLOW, NEUTRAL, PALETTE } from './palette';
import { positionToColumn } from './position';

// a track as the micro-synteny viewer draws it (micro.shim.ts): its aligned
// genes, each at its consensus column and row
export type DrawnGene = {
  name: string;
  family: string;
  x: number;
  y: number;
  fmin: number;
  fmax: number;
  strand?: number;
  glyph?: string;
};

export type DrawnTrack = {
  source: string;
  genus: string;
  species: string;
  chromosome_name: string;
  genes: DrawnGene[];
};

export type FigureInputs = {
  // the cluster's tracks as drawn, and as aligned, in the same order
  drawn: DrawnTrack[];
  alignment: ClusterAlignment;
  sameLocus: SameLocus[];
  spec: ParsedFigureSpec;
};

export const FIGURE_DEFAULTS = { w: 180, font: 7 };

// the credit every figure carries
export const WATERMARK =
  'Made with the Genome Context Viewer: gcv.legumeinfo.org';

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
  // the author's marks drawn, by the genes and positions that anchor them
  marks: {
    emphasised: string[];
    names: { gene: string; text: string }[];
    spans: {
      from: string;
      to: string;
      columns: [number, number];
      text?: string;
    }[];
    positions: {
      chromosome: string;
      position: number;
      text?: string;
      tracks: number;
    }[];
  };
};

export type FigureModel = {
  figure: Omit<MicroFigure, 'caption' | 'metadata'>;
  manifest: FigureManifest;
  notes: string[];
  // some genes' coordinates are still loading, so spans are incomplete
  loading: boolean;
  // the cluster's result tracks, for the form that chooses them
  trackOptions: TrackOption[];
};

// a result track the figure can show, named by a gene only it holds, so the
// spec's tracks can name it
export type TrackOption = {
  gene: string;
  genus: string;
  label: string;
  score: number | null;
  // chosen by the spec, before merging
  chosen: boolean;
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

// a position in Mb to the kb, as the label's span; the exact coordinates
// are in the manifest and the figure's metadata
const megabases = (n: number) => (n / 1e6).toFixed(3);

// a track aligned mostly in reverse reads right to left on the chromosome
const reversed = (t: TrackAlignment) => {
  const aligned = t.genes.filter((g) => g.orientation !== null);
  return (
    aligned.filter((g) => g.orientation === '-').length > aligned.length / 2
  );
};

const unique = <T>(items: T[]) => Array.from(new Set(items));

// The author's marks, placed on the figure's tracks: each anchor gene is
// found among the genes drawn, and each position through the genes of the
// tracks on its chromosome. A mark that can't be placed is noted, never
// drawn at a guess.
function figureMarks(
  spec: ParsedFigureSpec,
  tracks: FigureTrack[],
  chromosomes: string[][],
  notes: string[],
): { marks: FigureMarks; manifest: FigureManifest['marks'] } {
  const drawn = tracks.flatMap((t, track) =>
    t.genes.map((gene) => ({ track, gene })),
  );
  const names = unique(drawn.map((d) => d.gene.name));
  // every drawing of the gene named, or why there is none
  const find = (gene: string, what: string) => {
    const matches = matchGeneName(names, gene);
    if (matches.length === 0) {
      notes.push(`Not drawn: ${what}; ${gene} is not in the figure.`);
      return [];
    }
    if (matches.length > 1) {
      notes.push(
        `Not drawn: ${what}; ${gene} names several genes (${matches.join(', ')}), so use the full name.`,
      );
      return [];
    }
    return drawn.filter((d) => d.gene.name === matches[0]);
  };
  const manifest: FigureManifest['marks'] = {
    emphasised: [],
    names: [],
    spans: [],
    positions: [],
  };
  const marks: FigureMarks = { names: [], spans: [], positions: [] };
  (spec.em ?? []).forEach((gene) => {
    const found = find(gene, `the emphasis on ${gene}`);
    found.forEach((d) => (d.gene.emphasis = true));
    if (found.length > 0) manifest.emphasised.push(found[0].gene.name);
  });
  (spec.name ?? []).forEach(({ gene, text }) => {
    // the topmost drawing of the gene
    const [first] = find(gene, `the name “${text}”`);
    if (first === undefined) return;
    marks.names.push({
      track: first.track,
      x: first.gene.x,
      y: first.gene.y,
      text,
    });
    manifest.names.push({ gene: first.gene.name, text });
  });
  (spec.span ?? []).forEach(({ from, to, text }) => {
    const what = text !== undefined ? `the span “${text}”` : 'a span';
    const [a] = find(from, what);
    const [b] = find(to, what);
    if (a === undefined || b === undefined) return;
    const columns = [a.gene.x, b.gene.x].sort((p, q) => p - q) as [
      number,
      number,
    ];
    marks.spans.push({
      from: columns[0],
      to: columns[1],
      ...(text !== undefined ? { text } : {}),
    });
    manifest.spans.push({
      from: a.gene.name,
      to: b.gene.name,
      columns,
      ...(text !== undefined ? { text } : {}),
    });
  });
  (spec.pos ?? []).forEach(({ chromosome, position, text }) => {
    const what = `the position ${text !== undefined ? `“${text}” ` : ''}${chromosome}:${position}`;
    let placed = 0;
    tracks.forEach((t, track) => {
      if (!chromosomes[track].includes(chromosome)) return;
      const at = positionToColumn(t.genes, position);
      if (at === undefined || at.clipped !== undefined) return;
      const inside = t.genes.find(
        (g) => g.fmin <= position && position <= g.fmax,
      );
      // the row of the gene it falls in, or of the nearest gene
      const nearest =
        inside ??
        t.genes.reduce((p, q) =>
          Math.abs(q.x - at.x) < Math.abs(p.x - at.x) ? q : p,
        );
      marks.positions.push({
        track,
        x: at.x,
        y: nearest.y,
        inGene: inside !== undefined,
        ...(text !== undefined ? { text } : {}),
      });
      placed++;
    });
    if (placed === 0) {
      notes.push(
        `Not drawn: ${what}; no track in the figure on ${chromosome} has genes around it. Positions belong to one assembly, so name the chromosome as the figure's tracks do.`,
      );
      return;
    }
    manifest.positions.push({
      chromosome,
      position,
      ...(text !== undefined ? { text } : {}),
      tracks: placed,
    });
  });
  return { marks, manifest };
}

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
    // the view's order, which ordering then changes
    return results.filter((t) => chosen.includes(t));
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

// the columns shown, as the drawn range; the genes shown, from the first
// column's to the last's, so genes inserted beyond the ends are left out;
// and the crop's ends when it applied
function columnRange(
  kept: Track[],
  spec: ParsedFigureSpec,
  notes: string[],
): {
  range: [number, number];
  genes: [number, number];
  crop?: [string, string];
} {
  const xs = kept.flatMap((t) => t.drawn.genes.map((g) => g.x));
  const [min, max] = [Math.min(...xs), Math.max(...xs)];
  const all = { range: [min - 0.5, max + 0.5], genes: [min, max] } as {
    range: [number, number];
    genes: [number, number];
  };
  if (spec.crop === undefined) return all;
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
    return all;
  }
  const [a, b] = [Math.min(...ends), Math.max(...ends)];
  return { range: [a - 0.5, b + 0.5], genes: [a, b], crop: spec.crop };
}

export function figureModel(inputs: FigureInputs): FigureModel {
  const { drawn, alignment, spec } = inputs;
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
  const chosen = chooseTracks(tracks, spec, notes);
  const results = orderTracks(chosen, spec);
  let kept = [...queries, ...results];

  const merges = mergePairs(kept, inputs, notes);
  const mergedWith = new Map<Track, Track>();
  merges.forEach(([keep, drop]) => {
    if (kept.includes(keep) && kept.includes(drop)) {
      mergedWith.set(keep, drop);
      kept = kept.filter((t) => t !== drop);
    }
  });

  const { range, genes: geneRange, crop } = columnRange(kept, spec, notes);
  const inRange = (x: number) => x >= geneRange[0] && x <= geneRange[1];

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
      const side = (x: number) => (x < geneRange[0] ? 'left' : 'right');
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
    // the span as drawn, left to right: high to low for a reversed track,
    // which says so in words
    const reverse = reversed(t.aligned);
    const [from, to] = reverse ? [fmax, fmin] : [fmin, fmax];
    let locus = short
      ? name(chromosome)
      : `${name(chromosome)}: ${megabases(from)}–${megabases(to)} Mb${reverse ? ' (rev.)' : ''}`;
    if (other !== undefined) {
      locus += ` = ${name(other.aligned.chromosome)}`;
    }
    // GCV's species can carry the strain, which isn't italicized
    const [species, strain] = t.aligned.species.split(':');
    figureTracks.push({
      role: t.aligned.role,
      binomial: `${t.aligned.genus} ${species}`,
      ...(strain !== undefined ? { strain } : {}),
      locus,
      genome: `${t.aligned.source}:${t.aligned.genus} ${t.aligned.species}`,
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

  const { marks, manifest: markManifest } = figureMarks(
    spec,
    figureTracks,
    manifestTracks.map((t) =>
      t.mergedWith !== undefined
        ? [t.chromosome, t.mergedWith]
        : [t.chromosome],
    ),
    notes,
  );

  const figureGenes = figureTracks.flatMap((t) => t.genes);
  const has = (style: FigureGene['style']) =>
    figureGenes.some((g) => g.style === style);
  // The key names families by their IDs, in the order the figure's columns
  // meet them; a prefix every family shares, as the data source's family
  // set, is said once in the key's title.
  const prefixes = unique(requested.map((f) => f.split('.')[0]));
  const shared =
    requested.length > 0 &&
    prefixes.length === 1 &&
    requested.every((f) => f.includes('.'))
      ? prefixes[0]
      : undefined;
  const familyLabel = (family: string) =>
    shared === undefined ? family : family.slice(shared.length + 1);
  const legend: FigureLegendEntry[] = [
    ...requested.map((family) => ({
      style: (colourOf.has(family)
        ? 'colour'
        : 'neutral') as FigureGene['style'],
      fill: colourOf.get(family) ?? NEUTRAL,
      key: famlabels ? keys.get(family) : undefined,
      label: familyLabel(family),
    })),
    ...(figureGenes.some((g) => g.style === 'neutral' && !keys.has(g.family))
      ? [
          {
            style: 'neutral' as const,
            fill: NEUTRAL,
            label: 'other shared families',
          },
        ]
      : []),
    ...(has('hollow')
      ? [
          {
            style: 'hollow' as const,
            fill: HOLLOW,
            label: 'one gene in the figure',
          },
        ]
      : []),
    ...(has('orphan')
      ? [{ style: 'orphan' as const, fill: HOLLOW, label: 'no family' }]
      : []),
  ];
  const legendTitle =
    shared === undefined ? 'Gene families:' : `Gene families (${shared}):`;

  return {
    figure: {
      columns: range,
      tracks: figureTracks,
      marks,
      legend: spec.legend === false ? null : legend,
      legendTitle,
      size: {
        width: spec.w ?? FIGURE_DEFAULTS.w,
        font: spec.font ?? FIGURE_DEFAULTS.font,
        glyph: spec.glyph,
      },
      names: spec.names ?? false,
      famlabels,
      printCaption: spec.cap ?? false,
      watermark: WATERMARK,
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
      marks: markManifest,
    },
    notes,
    loading: missingCoordinates,
    trackOptions: trackOptions(tracks, chosen),
  };
}

// each result track, named by the gene nearest its middle that no other
// result track holds, or its middle gene when every gene is shared
function trackOptions(tracks: Track[], chosen: Track[]): TrackOption[] {
  const results = tracks.filter((t) => t.aligned.role === 'result');
  return results.map((t) => {
    const names = t.aligned.genes.map((g) => g.name);
    const others = new Set(
      results
        .filter((o) => o !== t)
        .flatMap((o) => o.aligned.genes.map((g) => g.name)),
    );
    const middle = Math.floor(names.length / 2);
    const byDistance = names
      .map((name, i) => ({ name, d: Math.abs(i - middle) }))
      .sort((a, b) => a.d - b.d);
    const gene =
      byDistance.find(({ name }) => !others.has(name))?.name ?? names[middle];
    const [species, strain] = t.aligned.species.split(':');
    return {
      gene,
      genus: t.aligned.genus,
      label: `${t.aligned.genus} ${species}${strain !== undefined ? ` ${strain}` : ''}, ${shortName(t.aligned.chromosome, LIS_ASSEMBLY_CHROMOSOME)}`,
      score: t.aligned.score,
      chosen: chosen.includes(t),
    };
  });
}
