// The figure of a micro-synteny cluster the user is making: which tracks and
// columns it shows, in what order, colored how, and at what print size. It is
// one URL parameter, fig, of key:value pairs joined by ';', so a link carries
// the figure; it is absent when no figure is open.
//
// Genes are named as the view shows them, or unprefixed when unambiguous,
// and lists join their items with '+'. Parsing keeps every pair it can read
// and reports the rest, so one bad pair in a shared link costs only itself.

export type FigureOrder = 'view' | 'score' | { genera: string[] };

export type FigureMerge = 'both' | [string, string][];

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
  // families to color; the rest are drawn neutral
  colour?: string[];
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
};

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
  famlabels: flag,
  labels: (v) => (v === 'full' || v === 'short' ? v : undefined),
  names: flag,
  w: number(...FIGURE_LIMITS.w),
  font: number(...FIGURE_LIMITS.font),
  glyph: number(...FIGURE_LIMITS.glyph),
  legend: flag,
  cap: flag,
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
  famlabels: (v) => (v ? '1' : '0'),
  labels: (v) => v,
  names: (v) => (v ? '1' : '0'),
  w: String,
  font: String,
  glyph: String,
  legend: (v) => (v ? '1' : '0'),
  cap: (v) => (v ? '1' : '0'),
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
