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
  FigureTrack,
  MicroFigure,
} from './micro-figure.model';
import {
  annotationMarks,
  bandLanes,
  headerBand,
  noteGutter,
} from '../annotations/annotation-marks';

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
const STROKE = '#000000';
// the largest fitted glyph, in mm
const MAX_GLYPH = 3;

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

function glyph(b: Builder, gene: FigureGene, size: number): Element {
  const stroke = gene.pinned ? 1.8 : 0.6;
  const style =
    `fill: ${gene.fill}; stroke: ${STROKE}; stroke-width: ${stroke}px;` +
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
): Element {
  const style =
    `fill: ${entry.fill}; stroke: ${STROKE}; stroke-width: 0.6px;` +
    (entry.style === 'orphan' ? ' stroke-dasharray: 1.5 1;' : '');
  return b.el('rect', {
    x: 0,
    y: -size / 2,
    width: size,
    height: size,
    style,
  });
}

// words wrapped into lines no wider than width
function wrap(
  content: string,
  width: number,
  fontSize: number,
  measure: MeasureText,
): string[] {
  const lines: string[] = [];
  let line = '';
  content.split(/\s+/).forEach((word) => {
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

export function drawMicroFigure(
  figure: MicroFigure,
  document: Document,
  measure: MeasureText,
): SVGSVGElement {
  const b = builder(document);
  const width = figure.size.width * PX_PER_MM;
  const font = figure.size.font * PX_PER_PT;
  const small = font * 0.8;
  const pad = font * 0.6;
  // the label column fits the widest label
  const labelWidth = Math.max(
    0,
    ...figure.tracks.map(
      (t) =>
        measure(t.binomial, font, true) + measure(` ${t.locus}`, font, false),
    ),
  );
  const [c0, c1] = figure.columns;
  const left = pad + labelWidth + pad;
  // notes need a gutter right of the tracks
  const right =
    width -
    pad -
    noteGutter(figure.annotations, small, (t, s) => measure(t, s));
  const columnWidth = (right - left) / Math.max(c1 - c0, 1);
  const size = Math.max(
    2,
    figure.size.glyph !== undefined
      ? figure.size.glyph * PX_PER_MM
      : Math.min(columnWidth * 0.7, MAX_GLYPH * PX_PER_MM),
  );
  const x = (column: number) =>
    left + ((column - c0) / (c1 - c0)) * (right - left);
  // rows: a glyph, the legend number above it, the gene name below it
  const above = figure.famlabels ? small * 1.2 : 0;
  const below = figure.names
    ? Math.max(
        0,
        ...figure.tracks.flatMap((t) =>
          t.genes.map((g) => measure(g.label, small)),
        ),
      ) + pad
    : 0;
  const row = Math.max(size * 1.5, font * 1.5) + above + below;
  const levels = trackLevels(figure.tracks);
  // rail thickness spans the figure's distances
  const distances = figure.tracks.flatMap((t) =>
    t.rails.map((rail) => neighborDistances({ genes: rail.ends })[0]),
  );
  const [dMin, dMax] = [Math.min(...distances), Math.max(...distances)];
  const thickness = (d: number) =>
    dMax > dMin ? 0.4 + ((d - dMin) / (dMax - dMin)) * 1.6 : 1;

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

  // headers, and labels over the first track, need a band of lanes above it
  const lanes = bandLanes(figure.annotations, {
    x,
    glyph: size,
    font: small,
    measure: (t, s) => measure(t, s),
  });
  let top = pad + headerBand(small, lanes);
  const header = pad;
  // each track's extent, for the annotations drawn over them
  const extents: { top: number; bottom: number; middle: number }[] = [];
  figure.tracks.forEach((track: FigureTrack, i) => {
    const g = b.el('g', {
      'data-track': i,
      'data-role': track.role,
    });
    const rowY = (y: number) => top + y * row + above + size * 0.75;
    // the label, beside the track's first row
    const label = text(b, '', pad, rowY(0), font);
    const binomial = b.el('tspan', { style: 'font-style: italic;' });
    binomial.textContent = track.binomial;
    const locus = b.el('tspan');
    locus.textContent = ` ${track.locus}`;
    label.appendChild(binomial);
    label.appendChild(locus);
    label.setAttribute('data-label', '');
    if (track.role === 'query') {
      label.setAttribute(
        'style',
        `${label.getAttribute('style')} font-weight: bold;`,
      );
    }
    g.appendChild(label);
    // rails under the genes
    track.rails.forEach((rail) => {
      const a = track.genes[rail.from];
      const width = thickness(neighborDistances({ genes: rail.ends })[0]);
      const style = `stroke: ${STROKE}; stroke-width: ${r(width)}px;`;
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
        // a neighbor outside the columns shown: the rail ends in an arrow at
        // the figure's edge
        const edge = rail.to === 'left' ? left : right;
        const y = rowY(a.y);
        g.appendChild(
          b.el('line', {
            x1: x(a.x),
            y1: y,
            x2: edge,
            y2: y,
            style,
            'data-rail': `${rail.from}-${rail.to}`,
          }),
        );
        const d = rail.to === 'left' ? -1 : 1;
        const tip = size * 0.25;
        g.appendChild(
          b.el('path', {
            d: `M${r(edge)},${r(y)}L${r(edge - d * tip)},${r(y - tip * 0.6)}L${r(edge - d * tip)},${r(y + tip * 0.6)}Z`,
            style: `fill: ${STROKE};`,
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
      });
      if (gene.pinned) geneGroup.setAttribute('data-pinned', '');
      geneGroup.appendChild(glyph(b, gene, size));
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
    extents.push({
      top: rowY(0) - size / 2 - pad / 2,
      bottom: rowY(levels[i] - 1) + size / 2 + pad / 2,
      middle: rowY(0),
    });
    top += levels[i] * row + pad;
  });

  // annotations over the tracks
  if (figure.annotations.length > 0) {
    const layer = b.el('g', { 'data-annotations': '' });
    annotationMarks(figure.annotations, {
      x,
      top: (t) => extents[t].top,
      bottom: (t) => extents[t].bottom,
      middle: (t) => extents[t].middle,
      glyph: size,
      font: small,
      measure: (t, s) => measure(t, s),
      header,
      lanes,
      gutter: right + pad,
    }).forEach((m) => {
      const e = b.el(m.tag, {
        ...m.attributes,
        'data-annotation': m.annotation,
        'data-annotation-kind': m.kind,
      });
      if (m.text !== undefined) e.textContent = m.text;
      layer.appendChild(e);
    });
    svg.appendChild(layer);
  }

  // the legend, wrapped into lines
  if (figure.legend !== null && figure.legend.length > 0) {
    top += pad;
    const swatch = font;
    let lineX = pad;
    const lineHeight = font * 1.6;
    const legend = b.el('g', { 'data-legend': '' });
    figure.legend.forEach((entry) => {
      const content =
        entry.key !== undefined ? `${entry.key} ${entry.label}` : entry.label;
      const entryWidth = swatch + pad / 2 + measure(content, font) + pad * 2;
      if (lineX > pad && lineX + entryWidth > width - pad) {
        lineX = pad;
        top += lineHeight;
      }
      const item = b.el('g', {
        transform: `translate(${r(lineX)}, ${r(top + lineHeight / 2)})`,
        'data-legend-style': entry.style,
      });
      item.appendChild(legendSwatch(b, entry, swatch));
      item.appendChild(text(b, content, swatch + pad / 2, 0, font));
      legend.appendChild(item);
      lineX += entryWidth;
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
      top += lineHeight;
    });
    svg.appendChild(caption);
  }

  const height = top + pad;
  background.setAttribute('height', String(r(height)));
  svg.setAttribute('width', `${r(figure.size.width)}mm`);
  svg.setAttribute('height', `${r(height / PX_PER_MM)}mm`);
  svg.setAttribute('viewBox', `0 0 ${r(width)} ${r(height)}`);
  return svg;
}
