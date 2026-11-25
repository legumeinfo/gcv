// Draws a micro-synteny figure as a static SVG for print: sized in mm, with
// its styles inline so it renders the same in any program, and every mark
// carrying data-* attributes that name what it shows. It places genes, rows
// and rails with the viewer's own layout functions, so a gene sits in the
// same column as on screen, and it draws the same figure for the same input.
import {
  glyphRotation,
  glyphShape,
  neighborDistances,
  railOffsets,
  trackLevels,
} from '../layout/micro-tracks';
import {
  FigureGene,
  FigureLegendEntry,
  FigureMarks,
  FigurePattern,
  FigureTrack,
  MicroFigure,
} from './micro-figure.model';

// the width of text at a font size in px, italic or not
export type MeasureText = (
  text: string,
  fontSize: number,
  italic?: boolean,
) => number;

const SVG = 'http://www.w3.org/2000/svg';
const PX_PER_MM = 96 / 25.4;
const PX_PER_PT = 96 / 72;
const FONT = 'sans-serif';
// Ink, from the loudest to the quietest. Hue is kept for gene families;
// everything else is black or grey, so nothing else reads as homology.
const STROKE = '#000000';
// every glyph's outline: enough to hold white and yellow glyphs, quieter
// than the colors inside it
const OUTLINE = '#4d4d4d';
// the secondary line of a track's label, and the key's title
const SECONDARY = '#595959';
// rails, lighter than any outline so they stay the background layer
const RAIL = '#8c8c8c';
// the watermark, light enough to recede beside the data
const WATERMARK_FILL = '#8c8c8c';
// the author's marks are black; their leaders are hairlines in grey
const LEADER = '#7f7f7f';
// line weights of the marks in pt, and their dot's radius in mm
const EMPHASIS_PT = 0.9;
const LEADER_PT = 0.3;
const SPAN_PT = 0.6;
const STEM_PT = 0.5;
const DOT_MM = 0.4;
// a name's leader bends this far below the names, in mm
const KNEE_MM = 1.2;
// the largest fitted glyph, in mm, and its share of a column
const MAX_GLYPH = 2.2;
const GLYPH_SHARE = 0.65;
// line weights in pt: outlines, and the range of rail thickness
const OUTLINE_PT = 0.3;
const RAIL_PT: [number, number] = [0.3, 1];
// where a rail continues past the columns shown, its last stretch is
// dotted, in mm; and the gap between labels and the first column
const CONTINUES_MM = 1.5;
const LABEL_GAP_MM = 1.5;

// coordinates to 0.01 px, so the output doesn't depend on float noise
const r = (n: number) => Math.round(n * 100) / 100;

type Builder = {
  el: (name: string, attributes?: Record<string, string | number>) => Element;
};

function builder(document: Document): Builder {
  return {
    el: (name, attributes = {}) => {
      const e = document.createElementNS(SVG, name);
      Object.entries(attributes).forEach(([k, v]) =>
        e.setAttribute(k, typeof v === 'number' ? String(r(v)) : v),
      );
      return e;
    },
  };
}

function text(
  b: Builder,
  content: string,
  x: number,
  y: number,
  fontSize: number,
  anchor: 'start' | 'middle' | 'end' = 'start',
): Element {
  const t = b.el('text', {
    x,
    y,
    'text-anchor': anchor,
    'dominant-baseline': 'central',
    style: `font-family: ${FONT}; font-size: ${r(fontSize)}px; fill: ${STROKE};`,
  });
  t.textContent = content;
  return t;
}

// A glyph's paint: its color, or a pattern of its color and ink defined once
// in the figure's defs. A pattern's tile is a third of a glyph, so a glyph
// shows a few stripes or dots at any size.
type Paint = (fill: string, pattern?: FigurePattern) => string;

function painter(b: Builder, svg: Element, size: number): Paint {
  const defined = new Map<string, string>();
  let defs: Element | undefined;
  const tile = Math.max(size / 3, 1.5);
  return (fill, pattern) => {
    if (pattern === undefined) return fill;
    const id = `gcv-figure-${pattern.kind}-${fill.slice(1)}-${pattern.ink.slice(1)}`;
    if (!defined.has(id)) {
      if (defs === undefined) {
        defs = b.el('defs');
        svg.insertBefore(defs, svg.firstChild);
      }
      const p = b.el('pattern', {
        id,
        patternUnits: 'userSpaceOnUse',
        width: tile,
        height: tile,
        ...(pattern.kind === 'stripes'
          ? { patternTransform: 'rotate(45)' }
          : {}),
        'data-pattern': pattern.kind,
      });
      p.appendChild(
        b.el('rect', { width: tile, height: tile, style: `fill: ${fill};` }),
      );
      p.appendChild(
        pattern.kind === 'stripes'
          ? b.el('rect', {
              width: tile * 0.4,
              height: tile,
              style: `fill: ${pattern.ink};`,
            })
          : b.el('circle', {
              cx: tile / 2,
              cy: tile / 2,
              r: tile * 0.22,
              style: `fill: ${pattern.ink};`,
            }),
      );
      defs.appendChild(p);
      defined.set(id, `url(#${id})`);
    }
    return defined.get(id);
  };
}

function glyph(
  b: Builder,
  gene: FigureGene,
  size: number,
  paint: Paint,
): Element {
  // emphasis is the smallest effective difference: a heavier black outline
  const [ink, stroke] = gene.emphasis
    ? [STROKE, EMPHASIS_PT * PX_PER_PT]
    : [OUTLINE, OUTLINE_PT * PX_PER_PT];
  const style =
    `fill: ${paint(gene.fill, gene.pattern)}; stroke: ${ink}; stroke-width: ${r(stroke)}px;` +
    (gene.style === 'orphan' ? ' stroke-dasharray: 1.5 1;' : '');
  if (glyphShape(gene) === 'circle') {
    return b.el('circle', { cx: 0, cy: 0, r: size * 0.32, style });
  }
  // pointing right, as the viewer draws a rotation of 90
  const h = size / 2;
  const path = `M${r(h)},0L${r(-h)},${r(-h * 0.9)}L${r(-h)},${r(h * 0.9)}Z`;
  const turn = glyphRotation(gene) === 90 ? 0 : 180;
  return b.el('path', {
    d: path,
    transform: turn === 0 ? '' : `rotate(${turn})`,
    style,
  });
}

function legendSwatch(
  b: Builder,
  entry: FigureLegendEntry,
  size: number,
  paint: Paint,
): Element {
  const style =
    `fill: ${paint(entry.fill, entry.pattern)}; stroke: ${OUTLINE}; stroke-width: ${r(OUTLINE_PT * PX_PER_PT)}px;` +
    (entry.style === 'orphan' ? ' stroke-dasharray: 1.5 1;' : '');
  return b.el('rect', {
    x: 0,
    y: -size / 2,
    width: size,
    height: size,
    style,
  });
}

// a word too wide for a line, as a URL can be, split into pieces that fit:
// after its separators where it can be, else between characters
function pieces(
  word: string,
  width: number,
  fontSize: number,
  measure: MeasureText,
): string[] {
  if (measure(word, fontSize) <= width) return [word];
  const parts = word.split(/(?<=[&;?,/])/);
  const result: string[] = [];
  let piece = '';
  const units = parts.flatMap((part) =>
    measure(part, fontSize) <= width ? [part] : Array.from(part),
  );
  units.forEach((unit) => {
    if (piece !== '' && measure(piece + unit, fontSize) > width) {
      result.push(piece);
      piece = unit;
    } else {
      piece += unit;
    }
  });
  if (piece !== '') result.push(piece);
  return result;
}

// words wrapped into lines no wider than width; a word wider than a line
// starts a line of its own and continues on the next
function wrap(
  content: string,
  width: number,
  fontSize: number,
  measure: MeasureText,
): string[] {
  const lines: string[] = [];
  let line = '';
  content.split(/\s+/).forEach((word) => {
    const split = pieces(word, width, fontSize, measure);
    if (split.length > 1) {
      if (line !== '') lines.push(line);
      lines.push(...split.slice(0, -1));
      line = split[split.length - 1];
      return;
    }
    const next = line === '' ? word : `${line} ${word}`;
    if (line !== '' && measure(next, fontSize) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line !== '') lines.push(line);
  return lines;
}

// Labels on one baseline, each as near its anchor as the others allow:
// centers pushed apart until neighbors clear each other by gap, and kept
// within [lo, hi].
function spread(
  labels: { x: number; width: number }[],
  gap: number,
  lo: number,
  hi: number,
): number[] {
  const order = labels
    .map((_, i) => i)
    .sort((a, b) => labels[a].x - labels[b].x);
  const centers = labels.map((l) => l.x);
  let edge = lo;
  order.forEach((i) => {
    const half = labels[i].width / 2;
    centers[i] = Math.max(centers[i], edge + half);
    edge = centers[i] + half + gap;
  });
  edge = hi;
  [...order].reverse().forEach((i) => {
    const half = labels[i].width / 2;
    centers[i] = Math.min(centers[i], edge - half);
    edge = centers[i] - half - gap;
  });
  return centers;
}

// each span's lane in the band, packed so no two overlap, lane 0 lowest
function spanLanes(extents: [number, number][], gap: number): number[] {
  const used: [number, number][][] = [];
  return extents.map(([l, r]) => {
    let k = 0;
    while (used[k]?.some(([a, b]) => l < b + gap && r > a - gap)) k++;
    (used[k] ??= []).push([l, r]);
    return k;
  });
}

export function drawMicroFigure(
  figure: MicroFigure,
  document: Document,
  measure: MeasureText,
): SVGSVGElement {
  const b = builder(document);
  const width = figure.size.width * PX_PER_MM;
  // the type: labels' first line, their second line and the key, and the
  // small text of gene names and family numbers
  const font = figure.size.font * PX_PER_PT;
  const second = font * (6 / 7);
  const small = font * 0.8;
  const pad = font * 0.6;
  // the label column fits the widest label, right-aligned against the tracks
  const firstLine = (t: FigureTrack) =>
    measure(t.binomial, font, true) +
    (t.strain !== undefined ? measure(` ${t.strain}`, font, false) : 0);
  const labelWidth = Math.max(
    0,
    ...figure.tracks.map((t) =>
      Math.max(firstLine(t), measure(t.locus, second, false)),
    ),
  );
  const labelEnd = pad + labelWidth;
  const [c0, c1] = figure.columns;
  const left = labelEnd + LABEL_GAP_MM * PX_PER_MM;
  const right = width - pad;
  const columnWidth = (right - left) / Math.max(c1 - c0, 1);
  const size = Math.max(
    2,
    figure.size.glyph !== undefined
      ? figure.size.glyph * PX_PER_MM
      : Math.min(columnWidth * GLYPH_SHARE, MAX_GLYPH * PX_PER_MM),
  );
  const x = (column: number) =>
    left + ((column - c0) / (c1 - c0)) * (right - left);
  // rows: a glyph and its two-line label, the legend number above it, the
  // gene name below it
  const above = figure.famlabels ? small * 1.2 : 0;
  const below = figure.names
    ? Math.max(
        0,
        ...figure.tracks.flatMap((t) =>
          t.genes.map((g) => measure(g.label, small)),
        ),
      ) + pad
    : 0;
  const core = Math.max(size * 1.6, (font + second) * 1.15);
  const row = core + above + below;
  // two levels of spacing: tracks of one genome sit closer than genomes
  const gap = (i: number) =>
    figure.tracks[i + 1]?.genome === figure.tracks[i].genome
      ? font * 0.15
      : font * 0.9;
  const levels = trackLevels(figure.tracks);

  // The author's marks need room: a band above the first track for the
  // spans and the first track's names, and space above any other track
  // with a name or a position on it.
  const marks: FigureMarks = figure.marks ?? {
    names: [],
    spans: [],
    positions: [],
  };
  const mm = PX_PER_MM;
  const glyphTop = size * 0.45;
  const stem = size * 0.9;
  const dot = DOT_MM * mm;
  const positionZone = size * 0.15 + stem + dot * 2 + 1;
  const nameZone = second * 1.3;
  const topNames = marks.names.filter((n) => n.track === 0);
  const nameWidths = topNames.map((n) => measure(n.text, font, true));
  const nameCenters = spread(
    topNames.map((n, i) => ({ x: x(n.x), width: nameWidths[i] })),
    pad,
    left,
    width - pad,
  );
  const spanExtents = marks.spans.map((sp): [number, number] => {
    const [a, b] = [x(sp.from) - size / 2, x(sp.to) + size / 2];
    const half = sp.text !== undefined ? measure(sp.text, second) / 2 : 0;
    const mid = (a + b) / 2;
    return [Math.min(a, mid - half), Math.max(b, mid + half)];
  });
  const lanes = spanLanes(spanExtents, pad);
  const spanLane = second * 1.6;
  const spanBand = (Math.max(-1, ...lanes) + 1) * spanLane;
  const nameBand = topNames.length > 0 ? font * 1.2 + KNEE_MM * mm : 0;
  const band = spanBand + nameBand;
  // the space above each track for its own names and positions
  const extra = figure.tracks.map((_, i) =>
    Math.max(
      marks.positions.some((p) => p.track === i) ? positionZone : 0,
      i > 0 && marks.names.some((n) => n.track === i) ? nameZone : 0,
    ),
  );

  // rail thickness spans the figure's distances
  const distances = figure.tracks.flatMap((t) =>
    t.rails.map((rail) => neighborDistances({ genes: rail.ends })[0]),
  );
  const [dMin, dMax] = [Math.min(...distances), Math.max(...distances)];
  const [thin, thick] = RAIL_PT.map((pt) => pt * PX_PER_PT);
  const thickness = (d: number) =>
    dMax > dMin ? thin + ((d - dMin) / (dMax - dMin)) * (thick - thin) : thin;

  const svg = b.el('svg', {
    xmlns: SVG,
    'data-figure': 'micro-synteny',
  }) as SVGSVGElement;
  const desc = b.el('desc');
  desc.textContent = figure.caption;
  svg.appendChild(desc);
  const metadata = b.el('metadata');
  metadata.textContent = JSON.stringify(figure.metadata);
  svg.appendChild(metadata);
  const background = b.el('rect', {
    x: 0,
    y: 0,
    width,
    style: 'fill: #ffffff;',
  });
  svg.appendChild(background);
  const paint = painter(b, svg, size);

  let top = pad + band;
  // where each track's rows are, for the marks drawn over them
  const rowYs: ((y: number) => number)[] = [];
  figure.tracks.forEach((track: FigureTrack, i) => {
    top += extra[i];
    const g = b.el('g', {
      'data-track': i,
      'data-role': track.role,
    });
    // a row's glyph sits in the middle of the space between its number and
    // its name
    const trackTop = top;
    const rowY = (y: number) => trackTop + y * row + above + core / 2;
    rowYs.push(rowY);
    // the label, beside the track's first row: the taxon, then the locus in
    // smaller grey type, both right-aligned against the tracks
    const label = b.el('g', { 'data-label': '' });
    const taxon = text(b, '', labelEnd, rowY(0) - second * 0.55, font, 'end');
    const binomial = b.el('tspan', { style: 'font-style: italic;' });
    binomial.textContent = track.binomial;
    taxon.appendChild(binomial);
    if (track.strain !== undefined) {
      const strain = b.el('tspan');
      strain.textContent = ` ${track.strain}`;
      taxon.appendChild(strain);
    }
    const locus = text(
      b,
      track.locus,
      labelEnd,
      rowY(0) + font * 0.55,
      second,
      'end',
    );
    locus.setAttribute(
      'style',
      `font-family: ${FONT}; font-size: ${r(second)}px; fill: ${SECONDARY};`,
    );
    label.appendChild(taxon);
    label.appendChild(locus);
    g.appendChild(label);
    // rails under the genes
    track.rails.forEach((rail) => {
      const a = track.genes[rail.from];
      const width = thickness(neighborDistances({ genes: rail.ends })[0]);
      const style = `stroke: ${RAIL}; stroke-width: ${r(width)}px;`;
      if (typeof rail.to === 'number') {
        const bGene = track.genes[rail.to];
        const [first, second] = a.x <= bGene.x ? [a, bGene] : [bGene, a];
        const height = Math.abs(rowY(first.y) - rowY(second.y));
        const [y1, y2] = railOffsets(first, second, height);
        const y0 = Math.min(rowY(first.y), rowY(second.y));
        g.appendChild(
          b.el('line', {
            x1: x(first.x),
            y1: y0 + y1,
            x2: x(second.x),
            y2: y0 + y2,
            style,
            'data-rail': `${rail.from}-${rail.to}`,
          }),
        );
      } else {
        // a neighbor outside the columns shown: the rail runs to the
        // figure's edge, its last stretch dotted, for "continues"
        const edge = rail.to === 'left' ? left : right;
        const d = rail.to === 'left' ? -1 : 1;
        const dots = edge - d * CONTINUES_MM * PX_PER_MM;
        const y = rowY(a.y);
        g.appendChild(
          b.el('line', {
            x1: x(a.x),
            y1: y,
            x2: dots,
            y2: y,
            style,
            'data-rail': `${rail.from}-${rail.to}`,
          }),
        );
        g.appendChild(
          b.el('line', {
            x1: dots,
            y1: y,
            x2: edge,
            y2: y,
            style: `stroke: ${RAIL}; stroke-width: ${r(Math.max(width, 0.8))}px; stroke-dasharray: 0.8 1.2;`,
            'data-rail-end': rail.to,
          }),
        );
      }
    });
    track.genes.forEach((gene) => {
      const geneGroup = b.el('g', {
        transform: `translate(${r(x(gene.x))}, ${r(rowY(gene.y))})`,
        'data-gene': gene.name,
        'data-family': gene.family,
        'data-column': String(gene.x),
        'data-style': gene.style,
        ...(gene.pattern !== undefined
          ? { 'data-pattern': gene.pattern.kind }
          : {}),
      });
      geneGroup.appendChild(glyph(b, gene, size, paint));
      if (figure.famlabels && gene.key !== undefined) {
        geneGroup.appendChild(
          text(
            b,
            String(gene.key),
            0,
            -size / 2 - small * 0.6,
            small,
            'middle',
          ),
        );
      }
      if (figure.names) {
        const name = text(b, gene.label, 0, 0, small, 'start');
        name.setAttribute(
          'transform',
          `translate(0, ${r(size / 2 + pad / 2)}) rotate(90)`,
        );
        geneGroup.appendChild(name);
      }
      g.appendChild(geneGroup);
    });
    svg.appendChild(g);
    top += levels[i] * row + gap(i);
  });

  // the author's marks, over the tracks
  const hasMarks =
    marks.names.length + marks.spans.length + marks.positions.length > 0;
  if (hasMarks) {
    const layer = b.el('g', { 'data-marks': '' });
    const mark = (kind: string, e: Element, text?: string): Element => {
      e.setAttribute('data-mark', kind);
      if (text !== undefined) e.setAttribute('data-mark-text', text);
      layer.appendChild(e);
      return e;
    };
    const label = (
      content: string,
      x0: number,
      y0: number,
      size: number,
      anchor: 'start' | 'middle',
      italic = false,
    ) => {
      const t = text(b, content, x0, y0, size, anchor);
      if (italic) {
        t.setAttribute(
          'style',
          `${t.getAttribute('style')} font-style: italic;`,
        );
      }
      return t;
    };
    const line = (d: string, pt: number, ink: string) =>
      b.el('path', {
        d,
        style: `fill: none; stroke: ${ink}; stroke-width: ${r(pt * PX_PER_PT)}px;`,
      });
    // positions: a dot on a stem above the row, its text beside the dot
    const stemTops: { track: number; x: number; top: number }[] = [];
    marks.positions.forEach((p) => {
      const px = x(p.x);
      const base = rowYs[p.track](p.y) - (p.inGene ? glyphTop + 1 : 0);
      const tip = rowYs[p.track](p.y) - glyphTop - size * 0.15 - stem;
      mark(
        'position',
        line(`M${r(px)},${r(base)}L${r(px)},${r(tip)}`, STEM_PT, STROKE),
        p.text,
      );
      mark(
        'position',
        b.el('circle', {
          cx: px,
          cy: tip - dot,
          r: dot,
          style: `fill: ${STROKE};`,
        }),
        p.text,
      );
      if (p.text !== undefined) {
        mark(
          'position',
          label(p.text, px + dot + 0.6 * mm, tip - dot, second, 'start'),
          p.text,
        );
      }
      stemTops.push({ track: p.track, x: px, top: tip - dot * 2 });
    });
    // spans: a rule over their columns, the text above it, in lanes
    marks.spans.forEach((sp, i) => {
      const ruleY = pad + spanBand - lanes[i] * spanLane - second * 0.3;
      const [a, b0] = [x(sp.from) - size / 2, x(sp.to) + size / 2];
      mark(
        'span',
        line(`M${r(a)},${r(ruleY)}L${r(b0)},${r(ruleY)}`, SPAN_PT, STROKE),
        sp.text,
      );
      if (sp.text !== undefined) {
        mark(
          'span',
          label(sp.text, (a + b0) / 2, ruleY - second * 0.7, second, 'middle'),
          sp.text,
        );
      }
    });
    // the first track's names, on one baseline, led down to their genes
    const nameY = pad + spanBand + font * 0.6;
    topNames.forEach((n, i) => {
      const cx = nameCenters[i];
      mark('name', label(n.text, cx, nameY, font, 'middle', true), n.text);
      const gx = x(n.x);
      const from = nameY + font * 0.6;
      const knee = from + KNEE_MM * mm;
      // to the gene, or to a position's dot standing on it
      const dotOn = stemTops.find(
        (st) => st.track === 0 && Math.abs(st.x - gx) < size / 2,
      );
      const to =
        (dotOn !== undefined ? dotOn.top : rowYs[0](n.y) - glyphTop) - 0.5 * mm;
      mark(
        'leader',
        line(
          Math.abs(cx - gx) < 0.5
            ? `M${r(gx)},${r(from)}L${r(gx)},${r(to)}`
            : `M${r(cx)},${r(from)}L${r(gx)},${r(knee)}L${r(gx)},${r(to)}`,
          LEADER_PT,
          LEADER,
        ),
        n.text,
      );
    });
    // other tracks' names, just above their glyphs
    marks.names
      .filter((n) => n.track > 0)
      .forEach((n) =>
        mark(
          'name',
          label(
            n.text,
            x(n.x),
            rowYs[n.track](n.y) - glyphTop - second * 0.6,
            second,
            'middle',
            true,
          ),
          n.text,
        ),
      );
    svg.appendChild(layer);
  }

  // the last line of text below the tracks: its middle and where it ends,
  // so the watermark can share it
  let last: { y: number; end: number } | undefined;

  // the legend, wrapped into lines
  if (figure.legend !== null && figure.legend.length > 0) {
    top += pad;
    const swatch = second * 0.9;
    let lineX = pad;
    const lineHeight = second * 1.7;
    const legend = b.el('g', { 'data-legend': '' });
    // the key's title starts its first line, in the labels' grey
    if (figure.legendTitle !== undefined) {
      const title = text(
        b,
        figure.legendTitle,
        lineX,
        top + lineHeight / 2,
        second,
      );
      title.setAttribute(
        'style',
        `font-family: ${FONT}; font-size: ${r(second)}px; fill: ${SECONDARY};`,
      );
      title.setAttribute('data-legend-title', '');
      legend.appendChild(title);
      lineX += measure(figure.legendTitle, second) + pad;
    }
    figure.legend.forEach((entry) => {
      const content =
        entry.key !== undefined ? `${entry.key} ${entry.label}` : entry.label;
      const entryWidth =
        swatch + pad / 2 + measure(content, second) + pad * 1.5;
      if (lineX > pad && lineX + entryWidth > width - pad) {
        lineX = pad;
        top += lineHeight;
      }
      const item = b.el('g', {
        transform: `translate(${r(lineX)}, ${r(top + lineHeight / 2)})`,
        'data-legend-style': entry.style,
        ...(entry.pattern !== undefined
          ? { 'data-pattern': entry.pattern.kind }
          : {}),
      });
      item.appendChild(legendSwatch(b, entry, swatch, paint));
      item.appendChild(text(b, content, swatch + pad / 2, 0, second));
      legend.appendChild(item);
      lineX += entryWidth;
      last = { y: top + lineHeight / 2, end: lineX - pad * 1.5 };
    });
    svg.appendChild(legend);
    top += lineHeight;
  }

  // the caption, wrapped to the figure's width
  if (figure.printCaption) {
    top += pad;
    const lineHeight = small * 1.4;
    const caption = b.el('g', { 'data-caption': '' });
    wrap(figure.caption, width - 2 * pad, small, measure).forEach((line) => {
      caption.appendChild(text(b, line, pad, top + lineHeight / 2, small));
      last = { y: top + lineHeight / 2, end: pad + measure(line, small) };
      top += lineHeight;
    });
    svg.appendChild(caption);
  }

  // the watermark, small and grey in the bottom right corner: on the last
  // line when there's room, else on a line of its own
  if (figure.watermark !== undefined) {
    const size = font * (5 / 7);
    const end = width - pad;
    let y: number;
    if (
      last !== undefined &&
      last.end + pad * 3 + measure(figure.watermark, size) <= end
    ) {
      y = last.y;
    } else {
      top += pad / 2;
      y = top + size * 0.7;
      top += size * 1.4;
    }
    const mark = text(b, figure.watermark, end, y, size, 'end');
    mark.setAttribute(
      'style',
      `font-family: ${FONT}; font-size: ${r(size)}px; fill: ${WATERMARK_FILL};`,
    );
    mark.setAttribute('data-watermark', '');
    svg.appendChild(mark);
  }

  const height = top + pad;
  background.setAttribute('height', String(r(height)));
  svg.setAttribute('width', `${r(figure.size.width)}mm`);
  svg.setAttribute('height', `${r(height / PX_PER_MM)}mm`);
  svg.setAttribute('viewBox', `0 0 ${r(width)} ${r(height)}`);
  return svg;
}
