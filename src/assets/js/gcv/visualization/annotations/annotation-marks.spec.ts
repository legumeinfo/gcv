import {
  AnnotationGeometry,
  PlacedAnnotation,
  annotationMarks,
  bandLanes,
  headerBand,
  noteGutter,
} from './annotation-marks';

// columns 100 px apart from x = 100; tracks 50 px tall from y = 20
const geometry: AnnotationGeometry = {
  x: (c) => 100 + c * 100,
  top: (t) => 20 + t * 50,
  bottom: (t) => 20 + t * 50 + 40,
  middle: (t) => 20 + t * 50 + 20,
  glyph: 20,
  font: 10,
  // half the font size per character
  measure: (text, size) => text.length * size * 0.5,
  header: 0,
  lanes: 1,
  gutter: 700,
};

const marks = (a: Parameters<typeof annotationMarks>[0]) =>
  annotationMarks(a, geometry);

describe('annotationMarks', () => {
  it('boxes each run of consecutive tracks, around the columns’ glyphs', () => {
    const boxes = marks([
      { id: 'b', kind: 'box', columns: [1, 2], tracks: [3, 0, 1], text: 'B' },
    ]).filter((m) => m.tag === 'rect');
    expect(boxes.map((m) => m.attributes)).toEqual([
      expect.objectContaining({ x: 185, y: 20, width: 130, height: 90 }),
      expect.objectContaining({ x: 185, y: 170, width: 130, height: 40 }),
    ]);
  });

  it('draws strokes without fill, the accent heavier', () => {
    const [plain] = marks([
      { id: 'p', kind: 'box', columns: [0, 0], tracks: [0] },
    ]);
    const [accent] = marks([
      { id: 'a', kind: 'box', columns: [0, 0], tracks: [0], style: 'accent' },
    ]);
    expect(plain.attributes.style).toContain('fill: none');
    expect(plain.attributes.style).toContain('stroke-width: 1px');
    expect(accent.attributes.style).toContain('stroke-width: 2.2px');
  });

  it('draws a gap as a dashed glyph in its slot', () => {
    const [gap] = marks([{ id: 'g', kind: 'gap', column: 2, track: 1 }]);
    expect(gap.attributes).toMatchObject({
      x: 290,
      y: 80,
      width: 20,
      height: 20,
    });
    expect(gap.attributes.style).toContain('stroke-dasharray');
  });

  it('leads notes to the gutter, stacking those that would overlap', () => {
    const texts = marks([
      { id: 'n1', kind: 'note', x: 1.5, track: 0, text: 'one' },
      { id: 'n2', kind: 'note', column: 3, track: 0, text: 'two' },
    ]).filter((m) => m.tag === 'text');
    expect(texts.map((t) => [t.attributes.x, t.attributes.y, t.text])).toEqual([
      [700, 40, 'one'],
      [700, 52, 'two'],
    ]);
  });

  it('heads a column, bracketing a span', () => {
    const single = marks([
      { id: 'h', kind: 'head', columns: [1, 1], text: 'Dt1' },
    ]);
    expect(single.map((m) => m.tag)).toEqual(['text']);
    expect(single[0].attributes.x).toBe(200);
    const span = marks([
      { id: 'h', kind: 'head', columns: [1, 3], text: 'span' },
    ]);
    expect(span.map((m) => m.tag)).toEqual(['text', 'path']);
    expect(span[0].attributes.x).toBe(300);
  });

  it('points at a position, bars an interval, and arrows one beyond the genes, all above the glyphs', () => {
    const site = marks([
      {
        id: 's',
        kind: 'site',
        text: 'R166W',
        sites: [
          { track: 0, x0: 1.5, x1: 1.5 },
          { track: 1, x0: 1, x1: 2, clipped: 'right' },
        ],
      },
    ]);
    expect(site.map((m) => m.tag)).toEqual(['path', 'text', 'rect', 'path']);
    // the pointer's tip is at the position, above the glyph, not across it
    const pointer = String(site[0].attributes.d);
    expect(pointer).toMatch(/^M250,/);
    const ys = pointer.match(/-?[\d.]+(?=[LZ])/g).map(Number);
    expect(Math.max(...ys)).toBeLessThanOrEqual(geometry.middle(0) - 10);
    const bar = site[2].attributes;
    expect(bar).toMatchObject({ x: 200, width: 100 });
    expect(Number(bar.y) + Number(bar.height)).toBeLessThanOrEqual(
      geometry.middle(1) - 10,
    );
  });

  it('marks every mark with its annotation and kind', () => {
    marks([
      { id: 'b', kind: 'box', columns: [0, 1], tracks: [0], text: 'x' },
      { id: 'n', kind: 'note', x: 0, track: 0, text: 'y' },
    ]).forEach((m) =>
      expect(['b box', 'n note']).toContain(`${m.annotation} ${m.kind}`),
    );
  });
});

describe('the space annotations need', () => {
  it('fits the gutter to the widest note, and the band to its lanes', () => {
    const measure = (text: string, size: number) => text.length * size;
    expect(
      noteGutter(
        [
          { id: 'a', kind: 'note', x: 0, track: 0, text: 'ab' },
          { id: 'b', kind: 'note', x: 0, track: 0, text: 'abcd' },
        ],
        10,
        measure,
      ),
    ).toBe(70);
    expect(noteGutter([], 10, measure)).toBe(0);
    expect(headerBand(10, 0)).toBe(0);
    expect(headerBand(10, 2)).toBe(36);
  });
});

// a header, a box's label and a site's label on one column, as for a gene
// that a box starts at and a variant lies in
const crowded: PlacedAnnotation[] = [
  { id: 'b', kind: 'box', columns: [1, 3], tracks: [0, 1], text: 'Dt1–GmSW19' },
  { id: 'h1', kind: 'head', columns: [1, 1], text: 'Dt1' },
  { id: 'h2', kind: 'head', columns: [3, 3], text: 'GmSW19' },
  { id: 's', kind: 'site', sites: [{ track: 0, x0: 1, x1: 1 }], text: 'R166W' },
];

describe('the band above the first track', () => {
  it('gives each label above the first track a lane where it overlaps none', () => {
    const lanes = bandLanes(crowded, geometry);
    expect(lanes).toBe(3);
    const band = { ...geometry, lanes, header: 0 };
    const top = headerBand(band.font, lanes);
    const labels = annotationMarks(crowded, {
      ...band,
      top: (t) => top + t * 50,
    })
      .filter((m) => m.tag === 'text')
      .map((m) => {
        const width = geometry.measure(m.text, 10);
        const x = Number(m.attributes.x);
        const middle = String(m.attributes.style).includes('middle');
        return {
          y: Number(m.attributes.y),
          from: middle ? x - width / 2 : x,
          to: middle ? x + width / 2 : x + width,
        };
      });
    expect(labels).toHaveLength(4);
    // the site's label nearest the tracks, the headers in one lane above it
    const [box, h1, h2, siteLabel] = labels;
    expect(siteLabel.y).toBeGreaterThan(h1.y);
    expect(h1.y).toBe(h2.y);
    expect(h1.y).toBeGreaterThan(box.y);
    labels.forEach((a, i) => {
      expect(a.y).toBeGreaterThan(0);
      expect(a.y).toBeLessThan(top);
      labels
        .slice(i + 1)
        .filter((b) => b.y === a.y)
        .forEach((b) => expect(a.to <= b.from || b.to <= a.from).toBe(true));
    });
  });

  it('needs no lanes for labels it can set side by side, or for none', () => {
    const apart: PlacedAnnotation[] = [
      { id: 'h1', kind: 'head', columns: [0, 0], text: 'a' },
      { id: 'h2', kind: 'head', columns: [4, 4], text: 'b' },
    ];
    expect(bandLanes(apart, geometry)).toBe(1);
    expect(
      bandLanes(
        [{ id: 'b', kind: 'box', columns: [1, 3], tracks: [1, 2], text: 'x' }],
        geometry,
      ),
    ).toBe(0);
  });
});
