import {
  AnnotationGeometry,
  annotationMarks,
  headerBand,
  needsHeaderBand,
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
  header: 0,
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

  it('ticks a position, bars an interval, and arrows one beyond the genes', () => {
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
    expect(site.map((m) => m.tag)).toEqual(['line', 'text', 'rect', 'path']);
    expect(site[0].attributes).toMatchObject({ x1: 250, x2: 250 });
    expect(site[2].attributes).toMatchObject({ x: 200, width: 100 });
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
  it('fits the gutter to the widest note, and the band to the font', () => {
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
    expect(headerBand(10)).toBe(26);
  });

  it('reserves the band for anything drawn above the first track', () => {
    const box = (tracks: number[], text?: string) =>
      needsHeaderBand([
        { id: 'b', kind: 'box', columns: [0, 1], tracks, text },
      ]);
    expect(box([0, 1], 'block')).toBe(true);
    expect(box([0, 1])).toBe(false);
    expect(box([1, 2], 'block')).toBe(false);
    const site = (track: number) =>
      needsHeaderBand([
        { id: 's', kind: 'site', sites: [{ track, x0: 1, x1: 1 }] },
      ]);
    expect(site(0)).toBe(true);
    expect(site(1)).toBe(false);
    expect(
      needsHeaderBand([{ id: 'h', kind: 'head', columns: [1, 1], text: 'h' }]),
    ).toBe(true);
  });
});
