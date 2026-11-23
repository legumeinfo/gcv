/**
 * @jest-environment jsdom
 */
import { FigureGene, MicroFigure } from './micro-figure.model';
import { MeasureText, drawMicroFigure } from './micro-figure';

// jsdom can't measure text, so every character is half the font size wide
const measure: MeasureText = (text, size) => text.length * size * 0.5;

const gene = (overrides: Partial<FigureGene>): FigureGene => ({
  name: 'g',
  label: 'g',
  family: 'a',
  x: 0,
  y: 0,
  fmin: 0,
  fmax: 100,
  strand: 1,
  style: 'colour',
  fill: '#E69F00',
  pinned: false,
  ...overrides,
});

const figure: MicroFigure = {
  columns: [-0.5, 2.5],
  tracks: [
    {
      role: 'query',
      binomial: 'Glycine max',
      locus: 'Gm15:1,000–3,100',
      genes: [
        gene({ name: 'q1', x: 0, key: 1 }),
        gene({ name: 'q2', x: 1, family: 'b', fill: '#56B4E9', key: 2 }),
        gene({
          name: 'q3',
          x: 2,
          family: '',
          style: 'orphan',
          fill: '#FFFFFF',
        }),
      ],
      rails: [
        {
          from: 0,
          to: 1,
          ends: [
            { fmin: 0, fmax: 100 },
            { fmin: 1000, fmax: 1100 },
          ],
        },
        {
          from: 1,
          to: 2,
          ends: [
            { fmin: 1000, fmax: 1100 },
            { fmin: 3000, fmax: 3100 },
          ],
        },
        {
          from: 2,
          to: 'right',
          ends: [
            { fmin: 3000, fmax: 3100 },
            { fmin: 9000, fmax: 9100 },
          ],
        },
      ],
    },
    {
      role: 'result',
      binomial: 'Phaseolus vulgaris',
      locus: 'Chr05:5,000–7,100',
      genes: [
        gene({ name: 'p1', x: 0, strand: -1, pinned: true, key: 1 }),
        gene({ name: 'p2', x: 1, y: 1, family: 'b', fill: '#56B4E9', key: 2 }),
        gene({
          name: 'pi',
          x: 0.5,
          family: 'x',
          style: 'hollow',
          fill: '#FFFFFF',
          strand: undefined,
        }),
      ],
      rails: [],
    },
  ],
  annotations: [],
  legend: [
    { style: 'colour', fill: '#E69F00', key: 1, label: 'a' },
    { style: 'colour', fill: '#56B4E9', key: 2, label: 'b' },
    {
      style: 'hollow',
      fill: '#FFFFFF',
      label: 'no other gene of its family in the figure',
    },
  ],
  size: { width: 85, font: 7 },
  names: true,
  famlabels: true,
  caption: 'A caption.',
  printCaption: true,
  metadata: { url: 'http://gcv/gene' },
};

const draw = (f: MicroFigure = figure) => drawMicroFigure(f, document, measure);

// a gene group's position, from its translate
const position = (g: Element) =>
  g
    .getAttribute('transform')
    .match(/translate\(([-\d.]+), ([-\d.]+)\)/)
    .slice(1)
    .map(Number);

describe('drawMicroFigure', () => {
  it('sizes the figure in mm, with a pixel viewBox at 96 per inch', () => {
    const svg = draw();
    expect(svg.getAttribute('width')).toBe('85mm');
    expect(svg.getAttribute('height')).toMatch(/^[\d.]+mm$/);
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBeCloseTo((85 * 96) / 25.4, 1);
    expect(h).toBeCloseTo(
      (parseFloat(svg.getAttribute('height')) * 96) / 25.4,
      0,
    );
  });

  it('draws every gene with the data it shows', () => {
    const genes = Array.from(draw().querySelectorAll('[data-gene]'));
    expect(
      genes.map((g) => [
        g.getAttribute('data-gene'),
        g.getAttribute('data-family'),
        g.getAttribute('data-column'),
        g.getAttribute('data-style'),
      ]),
    ).toEqual([
      ['q1', 'a', '0', 'colour'],
      ['q2', 'b', '1', 'colour'],
      ['q3', '', '2', 'orphan'],
      ['p1', 'a', '0', 'colour'],
      ['p2', 'b', '1', 'colour'],
      ['pi', 'x', '0.5', 'hollow'],
    ]);
  });

  it('draws genes of one column one above the other, later columns to the right', () => {
    const at = Object.fromEntries(
      Array.from(draw().querySelectorAll('[data-gene]')).map((g) => [
        g.getAttribute('data-gene'),
        position(g),
      ]),
    );
    expect(at.q1[0]).toBe(at.p1[0]);
    expect(at.q2[0]).toBe(at.p2[0]);
    expect(at.q1[0]).toBeLessThan(at.pi[0]);
    expect(at.pi[0]).toBeLessThan(at.q2[0]);
    expect(at.q2[0]).toBeLessThan(at.q3[0]);
    // the second row of a track is below its first
    expect(at.p2[1]).toBeGreaterThan(at.p1[1]);
  });

  it('fills each glyph with its color, dashes an orphan, and thickens a pin', () => {
    const style = (name: string) =>
      draw()
        .querySelector(`[data-gene="${name}"]`)
        .firstElementChild.getAttribute('style');
    expect(style('q1')).toContain('fill: #E69F00');
    expect(style('q3')).toContain('stroke-dasharray');
    expect(style('p1')).toContain('stroke-width: 1.8px');
    expect(style('q1')).toContain('stroke-width: 0.6px');
  });

  it('turns a reverse gene and draws an unknown strand as a circle', () => {
    const svg = draw();
    const glyph = (name: string) =>
      svg.querySelector(`[data-gene="${name}"]`).firstElementChild;
    expect(glyph('q1').getAttribute('transform')).toBe('');
    expect(glyph('p1').getAttribute('transform')).toBe('rotate(180)');
    expect(glyph('pi').tagName).toBe('circle');
  });

  it('ends a rail to a gene outside the columns in an arrow at the edge', () => {
    const svg = draw();
    expect(svg.querySelectorAll('[data-rail]')).toHaveLength(3);
    expect(svg.querySelector('[data-rail-end="right"]')).not.toBeNull();
  });

  it('labels each track, the binomial in italics and the query in bold', () => {
    const labels = Array.from(draw().querySelectorAll('[data-label]'));
    expect(labels.map((l) => l.textContent)).toEqual([
      'Glycine max Gm15:1,000–3,100',
      'Phaseolus vulgaris Chr05:5,000–7,100',
    ]);
    expect(labels[0].firstElementChild.getAttribute('style')).toBe(
      'font-style: italic;',
    );
    expect(labels[0].getAttribute('style')).toContain('font-weight: bold');
    expect(labels[1].getAttribute('style')).not.toContain('bold');
  });

  it('sets the font size on every text', () => {
    const texts = Array.from(draw().querySelectorAll('text'));
    expect(texts.length).toBeGreaterThan(10);
    texts.forEach((t) =>
      expect(t.getAttribute('style')).toMatch(/font-size: [\d.]+px/),
    );
    const label = draw().querySelector('[data-label]');
    expect(label.getAttribute('style')).toContain(
      `font-size: ${Math.round(((7 * 96) / 72) * 100) / 100}px`,
    );
  });

  it('numbers colored glyphs and legend entries when asked', () => {
    const svg = draw();
    expect(svg.querySelector('[data-gene="q2"] text')?.textContent).toBe('2');
    expect(
      Array.from(svg.querySelectorAll('[data-legend] text')).map(
        (t) => t.textContent,
      ),
    ).toEqual(['1 a', '2 b', 'no other gene of its family in the figure']);
    const plain = draw({ ...figure, famlabels: false, names: false });
    expect(plain.querySelectorAll('[data-gene] text')).toHaveLength(0);
  });

  it('carries the caption and metadata, and prints the caption when asked', () => {
    const svg = draw();
    expect(svg.querySelector('desc').textContent).toBe('A caption.');
    expect(JSON.parse(svg.querySelector('metadata').textContent)).toEqual({
      url: 'http://gcv/gene',
    });
    expect(svg.querySelector('[data-caption]').textContent).toBe('A caption.');
    expect(
      draw({ ...figure, printCaption: false, legend: null }).querySelector(
        '[data-caption], [data-legend]',
      ),
    ).toBeNull();
  });

  it('wraps a printed caption to the figure, breaking a long URL at its separators', () => {
    const url = `http://gcv/gene;lis=${'g'.repeat(40)}?${Array.from({ length: 30 }, (_, i) => `p${i}=${i}`).join('&')}`;
    const svg = draw({ ...figure, caption: `A caption. Made at ${url}` });
    const [, , width] = svg.getAttribute('viewBox').split(' ').map(Number);
    const lines = Array.from(svg.querySelectorAll('[data-caption] text'));
    expect(lines.length).toBeGreaterThan(2);
    lines.forEach((line) =>
      expect(
        Number(line.getAttribute('x')) +
          measure(line.textContent, 7 * 0.8 * (96 / 72)),
      ).toBeLessThanOrEqual(width),
    );
    // the URL reads back whole, its pieces unspaced
    expect(lines.map((l) => l.textContent).join(' ')).toContain('p0=0&p1=1&');
    expect(lines.map((l) => l.textContent).join('')).toContain(url);
  });

  it('credits GCV in small grey text in the bottom right corner', () => {
    const svg = draw({
      ...figure,
      watermark: 'Made by GCV: gcv.legumeinfo.org',
    });
    const mark = svg.querySelector('[data-watermark]');
    expect(mark.textContent).toBe('Made by GCV: gcv.legumeinfo.org');
    expect(mark.getAttribute('text-anchor')).toBe('end');
    expect(mark.getAttribute('style')).toContain('fill: #8c8c8c');
    const [, , width, height] = svg
      .getAttribute('viewBox')
      .split(' ')
      .map(Number);
    expect(Number(mark.getAttribute('x'))).toBeCloseTo(
      width - 7 * 0.6 * (96 / 72),
      1,
    );
    // below everything else
    const lowest = Math.max(
      ...Array.from(svg.querySelectorAll('text:not([data-watermark])')).map(
        (t) => Number(t.getAttribute('y')),
      ),
    );
    expect(Number(mark.getAttribute('y'))).toBeGreaterThanOrEqual(lowest);
    expect(Number(mark.getAttribute('y'))).toBeLessThan(height);
    expect(draw().querySelector('[data-watermark]')).toBeNull();
  });

  it('draws the same SVG for the same figure', () => {
    const serialize = (svg: Element) =>
      new XMLSerializer().serializeToString(svg);
    expect(serialize(draw())).toBe(serialize(draw()));
  });

  it('draws annotations over the tracks, making room for headers and notes', () => {
    const plain = draw();
    const annotated = draw({
      ...figure,
      annotations: [
        { id: 'b', kind: 'box', columns: [0, 1], tracks: [0, 1] },
        { id: 'h', kind: 'head', columns: [1, 1], text: 'Dt1' },
        { id: 'n', kind: 'note', x: 0.5, track: 1, text: 'inserted' },
      ],
    });
    expect(
      Array.from(annotated.querySelectorAll('[data-annotation]')).map(
        (m) => `${m.getAttribute('data-annotation')} ${m.tagName}`,
      ),
    ).toEqual(['b rect', 'h text', 'n path', 'n text']);
    // the header band moves the tracks down, and the gutter narrows them
    const position = (svg: SVGSVGElement, gene: string) =>
      svg
        .querySelector(`[data-gene="${gene}"]`)
        .getAttribute('transform')
        .match(/translate\(([-\d.]+), ([-\d.]+)\)/)
        .slice(1)
        .map(Number);
    const [x0, y0] = position(plain, 'q3');
    const [x1, y1] = position(annotated, 'q3');
    expect(y1).toBeGreaterThan(y0);
    expect(x1).toBeLessThan(x0);
    // the box encloses its columns' genes in both tracks
    const box = annotated.querySelector('[data-annotation="b"]');
    const left = Number(box.getAttribute('x'));
    const right = left + Number(box.getAttribute('width'));
    const [qx] = position(annotated, 'q1');
    const [px] = position(annotated, 'p2');
    expect(left).toBeLessThan(qx);
    expect(right).toBeGreaterThan(px);
  });
});
