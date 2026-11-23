// Annotations as marks: plain descriptions of the rectangles, lines, paths
// and text that draw them, from annotations already placed on consensus
// columns and drawn tracks. Every renderer of micro-synteny tracks draws
// these same marks, so an annotation looks and sits the same on screen and
// in a figure. Annotations are strokes without fills, so families' colors
// stay readable; the accent is a heavier stroke, not a color.

export type AnnotationKind = 'box' | 'gap' | 'note' | 'head' | 'site';

export type PlacedSite = {
  track: number;
  x0: number;
  x1: number;
  // the side of a position beyond the track's genes
  clipped?: 'left' | 'right';
};

// an annotation in column and track units; tracks are indices in the
// renderer's data
export type PlacedAnnotation = {
  id: string;
  kind: AnnotationKind;
  text?: string;
  style?: 'accent';
  // box, head: the first and last column
  columns?: [number, number];
  // box: the tracks it encloses
  tracks?: number[];
  // gap, and a note on a slot: the empty column and its track
  column?: number;
  track?: number;
  // a note on a gene: the gene's column, fractional for an insertion
  x?: number;
  sites?: PlacedSite[];
};

export type AnnotationGeometry = {
  x: (column: number) => number;
  // a track's top and bottom, and the middle of its first row
  top: (track: number) => number;
  bottom: (track: number) => number;
  middle: (track: number) => number;
  glyph: number;
  font: number;
  // the top of the band above the first track that holds headers
  header: number;
  // where notes' text starts, right of the tracks
  gutter: number;
};

export type AnnotationMark = {
  tag: 'rect' | 'line' | 'path' | 'text';
  attributes: Record<string, string | number>;
  text?: string;
  annotation: string;
  kind: AnnotationKind;
};

const INK = '#000000';

// the height of the band headers need above the first track
export const headerBand = (font: number) => font * 2.6;

const stroke = (a: PlacedAnnotation, dashed = false) =>
  `fill: none; stroke: ${INK}; stroke-width: ${a.style === 'accent' ? 2.2 : 1}px;` +
  (dashed ? ' stroke-dasharray: 3 2;' : '');

const textStyle = (size: number, anchor = 'start') =>
  `font-family: sans-serif; font-size: ${Math.round(size * 100) / 100}px; fill: ${INK}; text-anchor: ${anchor};`;

// consecutive runs of track indices, e.g. [1, 2, 4] -> [[1, 2], [4]]
function runs(tracks: number[]): number[][] {
  const sorted = Array.from(new Set(tracks)).sort((a, b) => a - b);
  const result: number[][] = [];
  sorted.forEach((t) => {
    const run = result[result.length - 1];
    if (run !== undefined && run[run.length - 1] === t - 1) run.push(t);
    else result.push([t]);
  });
  return result;
}

const arrow = (x: number, y: number, side: 'left' | 'right', size: number) => {
  const d = side === 'left' ? -1 : 1;
  return `M${x},${y}L${x - d * size},${y - size * 0.6}L${x - d * size},${y + size * 0.6}Z`;
};

export function annotationMarks(
  annotations: PlacedAnnotation[],
  g: AnnotationGeometry,
): AnnotationMark[] {
  const marks: AnnotationMark[] = [];
  const pad = g.glyph * 0.25;
  const small = g.font * 0.85;
  // notes stack in the gutter so their text doesn't overlap
  const noteRows: number[] = [];
  annotations.forEach((a) => {
    const mark = (
      tag: AnnotationMark['tag'],
      attributes: AnnotationMark['attributes'],
      text?: string,
    ) => marks.push({ tag, attributes, text, annotation: a.id, kind: a.kind });
    switch (a.kind) {
      case 'box': {
        const [c0, c1] = a.columns;
        const left = g.x(c0) - g.glyph / 2 - pad;
        const right = g.x(c1) + g.glyph / 2 + pad;
        runs(a.tracks).forEach((run, i) => {
          const top = g.top(run[0]);
          mark('rect', {
            x: left,
            y: top,
            width: right - left,
            height: g.bottom(run[run.length - 1]) - top,
            style: stroke(a),
          });
          if (a.text !== undefined && i === 0) {
            mark(
              'text',
              { x: left, y: top - small * 0.4, style: textStyle(small) },
              a.text,
            );
          }
        });
        break;
      }
      case 'gap': {
        const x = g.x(a.column);
        const y = g.middle(a.track);
        mark('rect', {
          x: x - g.glyph / 2,
          y: y - g.glyph / 2,
          width: g.glyph,
          height: g.glyph,
          style: stroke(a, true),
        });
        if (a.text !== undefined) {
          mark(
            'text',
            {
              x,
              y: y + g.glyph / 2 + small,
              style: textStyle(small, 'middle'),
            },
            a.text,
          );
        }
        break;
      }
      case 'note': {
        const x = g.x(a.x ?? a.column);
        const y = g.middle(a.track);
        // the first free row at or below the anchor
        let row = y;
        while (noteRows.some((r) => Math.abs(r - row) < g.font * 1.2)) {
          row += g.font * 1.2;
        }
        noteRows.push(row);
        mark('path', {
          d: `M${x + g.glyph / 2},${y}L${g.gutter - pad},${row}`,
          style: stroke(a),
        });
        mark(
          'text',
          {
            x: g.gutter,
            y: row,
            'dominant-baseline': 'central',
            style: textStyle(g.font),
          },
          a.text,
        );
        break;
      }
      case 'head': {
        const [c0, c1] = a.columns;
        const middle = (g.x(c0) + g.x(c1)) / 2;
        const base = g.header + headerBand(g.font) - pad;
        mark(
          'text',
          {
            x: middle,
            y: g.header + g.font,
            style: textStyle(g.font, 'middle'),
          },
          a.text,
        );
        if (c1 > c0) {
          const left = g.x(c0) - g.glyph / 2;
          const right = g.x(c1) + g.glyph / 2;
          const tick = g.font * 0.4;
          mark('path', {
            d: `M${left},${base}L${left},${base - tick}L${right},${base - tick}L${right},${base}`,
            style: stroke(a),
          });
        }
        break;
      }
      case 'site': {
        a.sites.forEach((site, i) => {
          const y = g.middle(site.track);
          const reach = g.glyph * 0.8;
          const [x0, x1] = [g.x(site.x0), g.x(site.x1)];
          if (x0 === x1) {
            mark('line', {
              x1: x0,
              y1: y - reach,
              x2: x0,
              y2: y + reach,
              style: stroke(a),
            });
          } else {
            mark('rect', {
              x: Math.min(x0, x1),
              y: y + g.glyph / 2,
              width: Math.abs(x1 - x0),
              height: g.glyph * 0.25,
              style: stroke(a),
            });
          }
          if (site.clipped !== undefined) {
            const edge =
              site.clipped === 'left' ? Math.min(x0, x1) : Math.max(x0, x1);
            mark('path', {
              d: arrow(edge, y - reach, site.clipped, g.glyph * 0.3),
              style: `fill: ${INK};`,
            });
          }
          if (a.text !== undefined && i === 0) {
            mark(
              'text',
              {
                x: (x0 + x1) / 2,
                y: y - reach - small * 0.5,
                style: textStyle(small, 'middle'),
              },
              a.text,
            );
          }
        });
        break;
      }
    }
  });
  return marks;
}

// the width notes need right of the tracks, for a text measure
export function noteGutter(
  annotations: PlacedAnnotation[],
  font: number,
  measure: (text: string, size: number) => number,
): number {
  const notes = annotations.filter((a) => a.kind === 'note');
  if (notes.length === 0) return 0;
  return Math.max(...notes.map((n) => measure(n.text, font))) + font * 3;
}

// whether anything is drawn above the first track: a header, a box's label,
// or a site's tick and label
export const needsHeaderBand = (annotations: PlacedAnnotation[]) =>
  annotations.some(
    (a) =>
      a.kind === 'head' ||
      (a.kind === 'box' && a.text !== undefined && a.tracks.includes(0)) ||
      (a.kind === 'site' && a.sites.some((s) => s.track === 0)),
  );
