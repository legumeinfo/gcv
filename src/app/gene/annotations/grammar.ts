// Annotations as the URL's annot parameter. An annotation names genes, never
// positions on the screen, so it stays on its data however the view is
// drawn:
//
//   annot = item *(";" item)
//   item  = kind "(" field *("," field) ")"
//   kind  = "box" / "gap" / "note" / "head" / "site"
//   field = key "=" value
//
// A value percent-encodes % ; ( ) , = + ~ and @. A gene is named as the view
// shows it, or without its prefix when that is unambiguous, with @source
// when several sources hold the name; '~' joins a span's ends and '+' a
// list's items. Parsing keeps every item it can read and reports the rest,
// so one bad item in a shared link costs only itself.

export type GeneRef = { name: string; source?: string };

export type Position = { chromosome: string; start: number; end?: number };

type Common = {
  // a query gene of the cluster, when an anchor gene is in several
  cl?: GeneRef;
  style?: 'accent';
  text?: string;
};

export type Annotation = Common &
  (
    | {
        kind: 'box';
        columns: [GeneRef, GeneRef];
        // every track, the query tracks, or the tracks of these genes
        tracks: '*' | 'q' | GeneRef[];
      }
    | { kind: 'gap'; column: GeneRef; track: GeneRef }
    | { kind: 'note'; gene: GeneRef }
    | { kind: 'note'; column: GeneRef; track: GeneRef }
    | { kind: 'head'; columns: [GeneRef, GeneRef] | [GeneRef] }
    | { kind: 'site'; at: Position }
  );

export type AnnotationKind = Annotation['kind'];

const SPECIAL = /[%;(),=+~@]/g;

const encode = (value: string) =>
  value.replace(
    SPECIAL,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  );

// undefined when the value isn't valid percent-encoding
const decode = (value: string): string | undefined => {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
};

function readGene(value: string): GeneRef | undefined {
  const [name, source, extra] = value.split('@').map(decode);
  if (name === undefined || name === '' || extra !== undefined) {
    return undefined;
  }
  if (source === undefined) return value.includes('@') ? undefined : { name };
  return source === '' ? undefined : { name, source };
}

const writeGene = ({ name, source }: GeneRef) =>
  source === undefined ? encode(name) : `${encode(name)}@${encode(source)}`;

function readList(value: string, separator: string): GeneRef[] | undefined {
  const genes = value.split(separator).map(readGene);
  return genes.every((g) => g !== undefined) ? genes : undefined;
}

function readPosition(value: string): Position | undefined {
  const text = decode(value);
  const match = text?.match(/^(.+):(\d+)(?:-(\d+))?$/);
  if (match === null || match === undefined) return undefined;
  const start = Number(match[2]);
  const end = match[3] === undefined ? undefined : Number(match[3]);
  if (start < 1 || (end !== undefined && end < start)) return undefined;
  return end === undefined
    ? { chromosome: match[1], start }
    : { chromosome: match[1], start, end };
}

const writePosition = ({ chromosome, start, end }: Position) =>
  encode(`${chromosome}:${start}${end === undefined ? '' : `-${end}`}`);

const KINDS: AnnotationKind[] = ['box', 'gap', 'note', 'head', 'site'];

// the fields each kind allows, beside the common ones
const FIELDS: Record<AnnotationKind, string[]> = {
  box: ['c', 't'],
  gap: ['c', 't'],
  note: ['g', 'c', 't'],
  head: ['c'],
  site: ['at'],
};
const COMMON_FIELDS = ['cl', 's', 'x'];

function readItem(item: string): Annotation | undefined {
  const match = item.match(/^([a-z]+)\((.*)\)$/);
  const kind = match?.[1] as AnnotationKind;
  if (match === null || !KINDS.includes(kind)) return undefined;
  const fields: Record<string, string> = {};
  for (const field of match[2] === '' ? [] : match[2].split(',')) {
    const i = field.indexOf('=');
    const key = field.slice(0, i);
    if (
      i <= 0 ||
      key in fields ||
      ![...FIELDS[kind], ...COMMON_FIELDS].includes(key)
    ) {
      return undefined;
    }
    fields[key] = field.slice(i + 1);
  }
  const common: Common = {};
  if (fields.cl !== undefined) {
    common.cl = readGene(fields.cl);
    if (common.cl === undefined) return undefined;
  }
  if (fields.s !== undefined) {
    if (fields.s !== 'accent') return undefined;
    common.style = 'accent';
  }
  if (fields.x !== undefined) {
    common.text = decode(fields.x);
    if (common.text === undefined || common.text === '') return undefined;
  }
  const span = (value: string | undefined) => {
    const ends = value === undefined ? undefined : readList(value, '~');
    return ends?.length === 1 || ends?.length === 2 ? ends : undefined;
  };
  switch (kind) {
    case 'box': {
      const columns = span(fields.c);
      if (columns?.length !== 2) return undefined;
      const t = fields.t ?? '*';
      const tracks = t === '*' || t === 'q' ? t : readList(t, '+');
      if (tracks === undefined) return undefined;
      return {
        ...common,
        kind,
        columns: columns as [GeneRef, GeneRef],
        tracks,
      };
    }
    case 'gap': {
      const column = span(fields.c);
      const track = fields.t === undefined ? undefined : readGene(fields.t);
      if (column?.length !== 1 || track === undefined) return undefined;
      return { ...common, kind, column: column[0], track };
    }
    case 'note': {
      if (common.text === undefined) return undefined;
      if (fields.g !== undefined) {
        const gene = readGene(fields.g);
        if (gene === undefined || 'c' in fields || 't' in fields) {
          return undefined;
        }
        return { ...common, kind, gene };
      }
      const column = span(fields.c);
      const track = fields.t === undefined ? undefined : readGene(fields.t);
      if (column?.length !== 1 || track === undefined) return undefined;
      return { ...common, kind, column: column[0], track };
    }
    case 'head': {
      const columns = span(fields.c);
      if (columns === undefined || common.text === undefined) return undefined;
      return {
        ...common,
        kind,
        columns: columns as [GeneRef, GeneRef] | [GeneRef],
      };
    }
    case 'site': {
      const at = fields.at === undefined ? undefined : readPosition(fields.at);
      if (at === undefined) return undefined;
      return { ...common, kind, at };
    }
  }
}

export function serializeAnnotation(a: Annotation): string {
  const fields: string[] = [];
  switch (a.kind) {
    case 'box':
      fields.push(`c=${a.columns.map(writeGene).join('~')}`);
      if (a.tracks !== '*') {
        fields.push(
          `t=${typeof a.tracks === 'string' ? a.tracks : a.tracks.map(writeGene).join('+')}`,
        );
      }
      break;
    case 'gap':
      fields.push(`c=${writeGene(a.column)}`, `t=${writeGene(a.track)}`);
      break;
    case 'note':
      if ('gene' in a) {
        fields.push(`g=${writeGene(a.gene)}`);
      } else {
        fields.push(`c=${writeGene(a.column)}`, `t=${writeGene(a.track)}`);
      }
      break;
    case 'head':
      fields.push(`c=${a.columns.map(writeGene).join('~')}`);
      break;
    case 'site':
      fields.push(`at=${writePosition(a.at)}`);
      break;
  }
  if (a.text !== undefined) fields.push(`x=${encode(a.text)}`);
  if (a.cl !== undefined) fields.push(`cl=${writeGene(a.cl)}`);
  if (a.style !== undefined) fields.push(`s=${a.style}`);
  return `${a.kind}(${fields.join(',')})`;
}

export function serializeAnnotations(annotations: Annotation[]): string {
  return annotations.map(serializeAnnotation).join(';');
}

export function parseAnnotations(value: string): {
  annotations: Annotation[];
  rejected: string[];
} {
  const annotations: Annotation[] = [];
  const rejected: string[] = [];
  value
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .forEach((item) => {
      const annotation = readItem(item);
      if (annotation === undefined) rejected.push(item);
      else annotations.push(annotation);
    });
  return { annotations, rejected };
}

// A short ID from the annotation itself, so it survives reordering and
// removing other annotations: FNV-1a of the serialized item, in base 36.
export function annotationID(a: Annotation): string {
  let hash = 0x811c9dc5;
  for (const c of serializeAnnotation(a)) {
    hash ^= c.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}
