// The figure of a micro-synteny cluster the user is making: which tracks and
// columns it shows, in what order, colored how, and at what print size. It is
// one URL parameter, fig, of key:value pairs joined by ';', so a link carries
// the figure; it is absent when no figure is open.
//
// Genes are named as the view shows them, or unprefixed when unambiguous,
// and lists join their items with '+'. Parsing keeps every pair it can read
// and reports the rest, so one bad pair in a shared link costs only itself.
//
// The figure's own marks are the author's, drawn in black: em emphasises
// genes, name names a gene (gene=text), span marks the columns between two
// genes (gene~gene=text), and pos marks a genomic position
// (chromosome:position=text). Their text percent-encodes %;+=~ so any
// label reads back as written.

export type FigureOrder = 'view' | 'score' | { genera: string[] };

export type FigureMerge = 'both' | [string, string][];

export type FigurePalette = 'safe' | 'view';

export type FigureSpec = {
  // a query gene of the figure's cluster
  cl?: string;
  // the best result tracks to keep, by score; query tracks are always kept
  top?: number;
  // tracks named by a gene each; overrides top
  tracks?: string[];
  // genera to keep
  genus?: string[];
  order?: FigureOrder;
  // same-locus pairs to merge: those with both kinds of evidence, or pairs
  // named by a gene in each track
  merge?: FigureMerge;
  // the columns to show, named by a gene in each end column
  crop?: [string, string];
  // families to color, named by their IDs or by a gene of each; the rest
  // are drawn neutral. Without it, every family with genes in more than one
  // place in the figure is colored.
  colour?: string[];
  // 'safe' colors families with Okabe and Ito's palette and patterns, which
  // readers with color-vision deficiencies can tell apart, for at most 21;
  // 'view' with the micro-synteny viewer's colors, for any number
  palette?: FigurePalette;
  // label each colored glyph with its legend number
  famlabels?: boolean;
  labels?: 'full' | 'short';
  // gene names under the glyphs
  names?: boolean;
  // width in mm, label size in pt, glyph size in mm
  w?: number;
  font?: number;
  glyph?: number;
  legend?: boolean;
  // the caption printed under the figure, not only in its metadata
  cap?: boolean;
  // the author's marks
  em?: string[];
  name?: FigureName[];
  span?: FigureSpan[];
  pos?: FigurePosition[];
};

export type FigureName = { gene: string; text: string };
export type FigureSpan = { from: string; to: string; text?: string };
export type FigurePosition = {
  chromosome: string;
  position: number;
  text?: string;
};

// a mark's text, with the grammar's own characters percent-encoded
const encode = (text: string) =>
  text.replace(
    /[%;+=~]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  );
const decode = (text: string): string | undefined => {
  try {
    return decodeURIComponent(text);
  } catch {
    return undefined;
  }
};

// a list's items, each read by item; undefined if any can't be
function items<T>(value: string, item: (v: string) => T | undefined) {
  const read = list(value).map(item);
  return read.length > 0 && read.every((i) => i !== undefined)
    ? (read as T[])
    : undefined;
}

// 'head=text', the text optional unless required
function labelled(
  value: string,
  required: boolean,
): { head: string; text?: string } | undefined {
  const i = value.indexOf('=');
  const head = (i === -1 ? value : value.slice(0, i)).trim();
  const text = i === -1 ? undefined : decode(value.slice(i + 1));
  if (head === '' || (i !== -1 && (text === undefined || text === ''))) {
    return undefined;
  }
  if (required && text === undefined) return undefined;
  return text === undefined ? { head } : { head, text };
}

export const FIGURE_LIMITS = {
  w: [40, 250],
  font: [4, 14],
  glyph: [1, 10],
} as const;

const list = (value: string): string[] =>
  value
    .split('+')
    .map((v) => v.trim())
    .filter((v) => v !== '');

const flag = (value: string): boolean | undefined =>
  value === '1' ? true : value === '0' ? false : undefined;

const number =
  (min: number, max: number, integer = false) =>
  (value: string): number | undefined => {
    const n = Number(value);
    const ok =
      value.trim() !== '' &&
      Number.isFinite(n) &&
      n >= min &&
      n <= max &&
      (!integer || Number.isInteger(n));
    return ok ? n : undefined;
  };

const nonEmpty = (items: string[]) => (items.length > 0 ? items : undefined);

// each key's reader: undefined means the value is malformed
const readers: {
  [K in keyof FigureSpec]-?: (value: string) => FigureSpec[K] | undefined;
} = {
  cl: (v) => (v.trim() === '' ? undefined : v.trim()),
  top: number(1, Number.MAX_SAFE_INTEGER, true),
  tracks: (v) => nonEmpty(list(v)),
  genus: (v) => nonEmpty(list(v)),
  order: (v) => {
    if (v === 'view' || v === 'score') return v;
    const genera = list(v);
    return genera.length > 0 ? { genera } : undefined;
  },
  merge: (v) => {
    if (v === 'both') return v;
    const pairs = list(v).map((p) => p.split('/'));
    return pairs.length > 0 &&
      pairs.every((p) => p.length === 2 && p.every((g) => g !== ''))
      ? (pairs as [string, string][])
      : undefined;
  },
  crop: (v) => {
    const ends = v.split('~').map((g) => g.trim());
    return ends.length === 2 && ends.every((g) => g !== '')
      ? (ends as [string, string])
      : undefined;
  },
  colour: (v) => nonEmpty(list(v)),
  palette: (v) => (v === 'safe' || v === 'view' ? v : undefined),
  famlabels: flag,
  labels: (v) => (v === 'full' || v === 'short' ? v : undefined),
  names: flag,
  w: number(...FIGURE_LIMITS.w),
  font: number(...FIGURE_LIMITS.font),
  glyph: number(...FIGURE_LIMITS.glyph),
  legend: flag,
  cap: flag,
  em: (v) => nonEmpty(list(v)),
  name: (v) =>
    items(v, (item) => {
      const l = labelled(item, true);
      return l && { gene: l.head, text: l.text };
    }),
  span: (v) =>
    items(v, (item) => {
      const l = labelled(item, false);
      const ends = l?.head.split('~').map((g) => g.trim());
      if (ends?.length !== 2 || ends.some((g) => g === '')) return undefined;
      return {
        from: ends[0],
        to: ends[1],
        ...(l.text !== undefined ? { text: l.text } : {}),
      };
    }),
  pos: (v) =>
    items(v, (item) => {
      const l = labelled(item, false);
      const m = l?.head.match(/^(.+):(\d+)$/);
      if (m === null || m === undefined || Number(m[2]) < 1) return undefined;
      return {
        chromosome: m[1],
        position: Number(m[2]),
        ...(l.text !== undefined ? { text: l.text } : {}),
      };
    }),
};

export const FIGURE_KEYS = Object.keys(readers) as (keyof FigureSpec)[];

export function parseFigureSpec(value: string): {
  spec: FigureSpec;
  rejected: string[];
} {
  const spec: FigureSpec = {};
  const rejected: string[] = [];
  value
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => pair !== '')
    .forEach((pair) => {
      const i = pair.indexOf(':');
      const key = pair.slice(0, i) as keyof FigureSpec;
      const read = i > 0 ? readers[key] : undefined;
      const parsed = read?.(pair.slice(i + 1));
      if (parsed === undefined) {
        rejected.push(pair);
      } else {
        (spec as Record<string, unknown>)[key] = parsed;
      }
    });
  return { spec, rejected };
}

const writers: {
  [K in keyof FigureSpec]-?: (value: FigureSpec[K]) => string;
} = {
  cl: (v) => v,
  top: String,
  tracks: (v) => v.join('+'),
  genus: (v) => v.join('+'),
  order: (v) => (typeof v === 'string' ? v : v.genera.join('+')),
  merge: (v) => (v === 'both' ? v : v.map((p) => p.join('/')).join('+')),
  crop: (v) => v.join('~'),
  colour: (v) => v.join('+'),
  palette: (v) => v,
  famlabels: (v) => (v ? '1' : '0'),
  labels: (v) => v,
  names: (v) => (v ? '1' : '0'),
  w: String,
  font: String,
  glyph: String,
  legend: (v) => (v ? '1' : '0'),
  cap: (v) => (v ? '1' : '0'),
  em: (v) => v.join('+'),
  name: (v) => v.map((n) => `${n.gene}=${encode(n.text)}`).join('+'),
  span: (v) =>
    v
      .map(
        (s) =>
          `${s.from}~${s.to}${s.text !== undefined ? `=${encode(s.text)}` : ''}`,
      )
      .join('+'),
  pos: (v) =>
    v
      .map(
        (p) =>
          `${p.chromosome}:${p.position}${p.text !== undefined ? `=${encode(p.text)}` : ''}`,
      )
      .join('+'),
};

// the spec as the fig parameter, its keys in a fixed order
export function serializeFigureSpec(spec: FigureSpec): string {
  return FIGURE_KEYS.filter((key) => spec[key] !== undefined)
    .map((key) => {
      const write = writers[key] as (value: unknown) => string;
      return `${key}:${write(spec[key])}`;
    })
    .join(';');
}

// the pairs the URL held that the spec couldn't read, for the figure to report
export type ParsedFigureSpec = FigureSpec & { rejected?: string[] };

export type FigureParams = {
  fig: ParsedFigureSpec | null;
};

export const figureParamMembers = ['fig'];

export const figureParamValidators = {};

export const figureParamParsers = {
  fig: (s: string | string[]): ParsedFigureSpec => {
    const { spec, rejected } = parseFigureSpec(
      Array.isArray(s) ? s.join(';') : s,
    );
    return rejected.length > 0 ? { ...spec, rejected } : spec;
  },
};
