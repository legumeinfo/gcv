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

function glyph(b: Builder, gene: FigureGene, size: number): Element {
  const stroke = OUTLINE_PT * PX_PER_PT;
  const style =
    `fill: ${gene.fill}; stroke: ${OUTLINE}; stroke-width: ${r(stroke)}px;` +
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
    `fill: ${entry.fill}; stroke: ${OUTLINE}; stroke-width: ${r(OUTLINE_PT * PX_PER_PT)}px;` +
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

  let top = pad;
  figure.tracks.forEach((track: FigureTrack, i) => {
    const g = b.el('g', {
      'data-track': i,
      'data-role': track.role,
    });
    // a row's glyph sits in the middle of the space between its number and
    // its name
    const rowY = (y: number) => top + y * row + above + core / 2;
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
      });
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
    top += levels[i] * row + gap(i);
  });

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
      });
      item.appendChild(legendSwatch(b, entry, swatch));
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
