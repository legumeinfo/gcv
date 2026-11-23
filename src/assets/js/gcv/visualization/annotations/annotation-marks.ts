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
  // the width of text at a font size
  measure: (text: string, size: number) => number;
  // the top of the band above the first track, and the lanes the renderer
  // reserved there (bandLanes)
  header: number;
  lanes: number;
  // where notes' text starts, right of the tracks
  gutter: number;
};

// what packing the band's labels needs
export type BandGeometry = Pick<
  AnnotationGeometry,
  'x' | 'glyph' | 'font' | 'measure'
>;

export type AnnotationMark = {
  tag: 'rect' | 'line' | 'path' | 'text';
  attributes: Record<string, string | number>;
  text?: string;
  annotation: string;
  kind: AnnotationKind;
};

const INK = '#000000';

// The band above the first track holds headers, and the labels of boxes and
// sites on the first track, in lanes, so that none overlap: a lane holds a
// line of text and a header's bracket. Lane 0 is nearest the tracks.
const laneHeight = (font: number) => font * 1.6;
const bandMargin = (font: number) => font * 0.4;

// the height of a band of lanes
export const headerBand = (font: number, lanes: number) =>
  lanes === 0 ? 0 : lanes * laneHeight(font) + bandMargin(font);

// a label in the band; a site's label sits in the lanes nearest the
// tracks, right above the pointer it names, and the rest pack above those
type BandLabel = { id: string; extent: [number, number]; site: boolean };

// each annotation's label in the band, with the horizontal extent it needs:
// sites, then headers, so they line up, then boxes
function bandLabels(
  annotations: PlacedAnnotation[],
  g: BandGeometry,
): BandLabel[] {
  const small = g.font * 0.85;
  const centered = (x: number, text: string, size: number) => {
    const w = g.measure(text, size);
    return [x - w / 2, x + w / 2] as [number, number];
  };
  const heads = annotations
    .filter((a) => a.kind === 'head')
    .map((a) => {
      const [c0, c1] = a.columns;
      const [l, r] = centered((g.x(c0) + g.x(c1)) / 2, a.text, g.font);
      const span: [number, number] =
        c1 > c0 ? [g.x(c0) - g.glyph / 2, g.x(c1) + g.glyph / 2] : [l, r];
      return {
        id: a.id,
        extent: [Math.min(l, span[0]), Math.max(r, span[1])] as [
          number,
          number,
        ],
        site: false,
      };
    });
  const sites = annotations
    .filter(
      (a) =>
        a.kind === 'site' && a.text !== undefined && a.sites[0]?.track === 0,
    )
    .map((a) => {
      const { x0, x1 } = a.sites[0];
      return {
        id: a.id,
        extent: centered((g.x(x0) + g.x(x1)) / 2, a.text, small),
        site: true,
      };
    });
  const boxes = annotations
    .filter(
      (a) => a.kind === 'box' && a.text !== undefined && a.tracks.includes(0),
    )
    .map((a) => {
      const left = g.x(a.columns[0]) - g.glyph / 2 - g.glyph * 0.25;
      return {
        id: a.id,
        extent: [left, left + g.measure(a.text, small)] as [number, number],
        site: false,
      };
    });
  return [...sites, ...heads, ...boxes];
}

// each band label's lane, packed greedily, and how many lanes they need
function packBand(
  annotations: PlacedAnnotation[],
  g: BandGeometry,
): { lanes: number; lane: Map<string, number> } {
  const gap = g.font * 0.5;
  const used: [number, number][][] = [];
  const lane = new Map<string, number>();
  // the lanes sites' labels took, which the others start above
  let sites = 0;
  bandLabels(annotations, g).forEach(({ id, extent: [l, r], site }) => {
    let k = site ? 0 : sites;
    while (used[k]?.some(([a, b]) => l < b + gap && r > a - gap)) k++;
    if (site) sites = Math.max(sites, k + 1);
    (used[k] ??= []).push([l, r]);
    lane.set(id, k);
  });
  return { lanes: used.length, lane };
}

// the lanes the band above the first track needs
export const bandLanes = (annotations: PlacedAnnotation[], g: BandGeometry) =>
  packBand(annotations, g).lanes;

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
  // labels in the band take their packed lane, or the top lane past those
  // the renderer reserved, as after it narrows
  const { lane } = packBand(annotations, g);
  const laneTop = (id: string) => {
    const k = Math.min(lane.get(id) ?? 0, Math.max(g.lanes - 1, 0));
    const bottom = g.header + headerBand(g.font, g.lanes) - bandMargin(g.font);
    return bottom - (k + 1) * laneHeight(g.font);
  };
  // text in a lane sits on the same baseline whatever its size
  const laneText = (id: string) => laneTop(id) + g.font * 0.95;
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
            const y = run[0] === 0 ? laneText(a.id) : top - small * 0.4;
            mark('text', { x: left, y, style: textStyle(small) }, a.text);
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
        // the bracket under the text, its ticks reaching down
        const base = laneTop(a.id) + laneHeight(g.font) - g.font * 0.1;
        mark(
          'text',
          {
            x: middle,
            y: laneText(a.id),
            style: textStyle(g.font, 'middle'),
          },
          a.text,
        );
        if (c1 > c0) {
          const left = g.x(c0) - g.glyph / 2;
          const right = g.x(c1) + g.glyph / 2;
          const tick = g.font * 0.3;
          mark('path', {
            d: `M${left},${base}L${left},${base - tick}L${right},${base - tick}L${right},${base}`,
            style: stroke(a),
          });
        }
        break;
      }
      case 'site': {
        // a pointer above the gene, or a bar over an interval, so the mark
        // never covers a glyph and its label sits right above it
        const size = g.glyph * (a.style === 'accent' ? 0.45 : 0.35);
        a.sites.forEach((site, i) => {
          const tip = g.middle(site.track) - g.glyph / 2 - g.glyph * 0.08;
          const [x0, x1] = [g.x(site.x0), g.x(site.x1)];
          if (x0 === x1) {
            mark('path', {
              d: `M${x0},${tip}L${x0 - size * 0.6},${tip - size}L${x0 + size * 0.6},${tip - size}Z`,
              style: `fill: ${INK};`,
            });
          } else {
            mark('rect', {
              x: Math.min(x0, x1),
              y: tip - size * 0.6,
              width: Math.abs(x1 - x0),
              height: size * 0.6,
              style: `fill: ${INK};`,
            });
          }
          if (site.clipped !== undefined) {
            const edge =
              site.clipped === 'left' ? Math.min(x0, x1) : Math.max(x0, x1);
            mark('path', {
              d: arrow(edge, tip - size * 0.3, site.clipped, g.glyph * 0.3),
              style: `fill: ${INK};`,
            });
          }
          if (a.text !== undefined && i === 0) {
            mark(
              'text',
              {
                x: (x0 + x1) / 2,
                y: site.track === 0 ? laneText(a.id) : tip - size - small * 0.4,
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
