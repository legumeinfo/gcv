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
  ...overrides,
});

const figure: MicroFigure = {
  columns: [-0.5, 2.5],
  tracks: [
    {
      role: 'query',
      binomial: 'Glycine max',
      strain: 'Wm82',
      locus: 'Gm15: 0.001–0.003 Mb',
      genome: 'lis:Glycine max:Wm82',
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
      locus: 'Chr05: 0.005–0.007 Mb',
      genome: 'lis:Phaseolus vulgaris',
      genes: [
        gene({ name: 'p1', x: 0, strand: -1, key: 1 }),
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

  it('fills each glyph with its color, and dashes an orphan', () => {
    const style = (name: string) =>
      draw()
        .querySelector(`[data-gene="${name}"]`)
        .firstElementChild.getAttribute('style');
    expect(style('q1')).toContain('fill: #E69F00');
    expect(style('q3')).toContain('stroke-dasharray');
    // one thin grey outline for every glyph
    expect(style('q1')).toContain('stroke: #4d4d4d; stroke-width: 0.4px');
  });

  it('paints a patterned glyph and its key with one pattern of its color and ink', () => {
    const pattern = { kind: 'stripes' as const, ink: '#FFFFFF' };
    const striped: MicroFigure = {
      ...figure,
      tracks: figure.tracks.map((t, i) =>
        i === 0
          ? {
              ...t,
              genes: t.genes.map((g) =>
                g.name === 'q2' ? { ...g, pattern } : g,
              ),
            }
          : t,
      ),
      legend: [
        { style: 'colour', fill: '#56B4E9', pattern, label: 'b', key: 2 },
      ],
    };
    const svg = draw(striped);
    const patterns = svg.querySelectorAll('defs > pattern');
    expect(patterns).toHaveLength(1);
    const id = patterns[0].getAttribute('id');
    expect(patterns[0].innerHTML).toContain('fill: #56B4E9');
    expect(patterns[0].innerHTML).toContain('fill: #FFFFFF');
    const glyph = svg.querySelector('[data-gene="q2"]');
    expect(glyph.getAttribute('data-pattern')).toBe('stripes');
    expect(glyph.firstElementChild.getAttribute('style')).toContain(
      `fill: url(#${id})`,
    );
    const key = svg.querySelector('[data-legend-style="colour"]');
    expect(key.firstElementChild.getAttribute('style')).toContain(
      `fill: url(#${id})`,
    );
    // a figure without patterns has no defs
    expect(draw().querySelector('defs')).toBeNull();
  });

  it('turns a reverse gene and draws an unknown strand as a circle', () => {
    const svg = draw();
    const glyph = (name: string) =>
      svg.querySelector(`[data-gene="${name}"]`).firstElementChild;
    expect(glyph('q1').getAttribute('transform')).toBe('');
    expect(glyph('p1').getAttribute('transform')).toBe('rotate(180)');
    expect(glyph('pi').tagName).toBe('circle');
  });

  it('draws rails grey, and dots a rail’s end where it continues past the columns', () => {
    const svg = draw();
    expect(svg.querySelectorAll('[data-rail]')).toHaveLength(3);
    svg
      .querySelectorAll('[data-rail]')
      .forEach((l) => expect(l.getAttribute('style')).toContain('#8c8c8c'));
    const end = svg.querySelector('[data-rail-end="right"]');
    expect(end.tagName).toBe('line');
    expect(end.getAttribute('style')).toContain('stroke-dasharray');
    expect(svg.querySelectorAll('path[data-rail-end]')).toHaveLength(0);
  });

  it("titles the key, in the labels' grey", () => {
    const title = draw({
      ...figure,
      legendTitle: 'Gene families (fam):',
    }).querySelector('[data-legend-title]');
    expect(title.textContent).toBe('Gene families (fam):');
    expect(title.getAttribute('style')).toContain('fill: #595959');
  });

  it('labels each track in two lines against the tracks: the taxon, then the locus in grey', () => {
    const svg = draw();
    const labels = Array.from(svg.querySelectorAll('[data-label]')).map((l) =>
      Array.from(l.querySelectorAll('text')),
    );
    expect(labels.map((l) => l.map((t) => t.textContent))).toEqual([
      ['Glycine max Wm82', 'Gm15: 0.001–0.003 Mb'],
      ['Phaseolus vulgaris', 'Chr05: 0.005–0.007 Mb'],
    ]);
    const [taxon, locus] = labels[0];
    expect(taxon.firstElementChild.getAttribute('style')).toBe(
      'font-style: italic;',
    );
    expect(taxon.lastElementChild.getAttribute('style')).toBeNull();
    expect(locus.getAttribute('style')).toContain('fill: #595959');
    // right-aligned, ending left of the first column, and nothing bold
    labels.flat().forEach((t) => {
      expect(t.getAttribute('text-anchor')).toBe('end');
      expect(t.getAttribute('style') ?? '').not.toContain('bold');
    });
    const firstGene = Math.min(
      ...Array.from(svg.querySelectorAll('[data-gene]')).map((g) =>
        Number(g.getAttribute('transform').match(/translate\(([-\d.]+)/)[1]),
      ),
    );
    expect(Number(taxon.getAttribute('x'))).toBeLessThan(firstGene);
  });

  it('sets tracks of one genome closer than tracks of different genomes', () => {
    const three = {
      ...figure,
      tracks: [
        figure.tracks[0],
        { ...figure.tracks[0], role: 'result' as const },
        { ...figure.tracks[1] },
      ],
    };
    const ys = Array.from(
      draw(three).querySelectorAll('[data-label] text:first-child'),
    ).map((t) => Number(t.getAttribute('y')));
    expect(ys[1] - ys[0]).toBeLessThan(ys[2] - ys[1]);
  });

  it('sets the font size on every text', () => {
    const texts = Array.from(draw().querySelectorAll('text'));
    expect(texts.length).toBeGreaterThan(10);
    texts.forEach((t) =>
      expect(t.getAttribute('style')).toMatch(/font-size: [\d.]+px/),
    );
    const label = draw().querySelector('[data-label] text');
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
      watermark: 'Made with the Genome Context Viewer: gcv.legumeinfo.org',
    });
    const mark = svg.querySelector('[data-watermark]');
    expect(mark.textContent).toBe(
      'Made with the Genome Context Viewer: gcv.legumeinfo.org',
    );
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
});

describe('the author’s marks', () => {
  const marked: MicroFigure = {
    ...figure,
    tracks: [
      {
        ...figure.tracks[0],
        genes: figure.tracks[0].genes.map((g) =>
          g.name === 'q2' ? { ...g, emphasis: true } : g,
        ),
      },
      figure.tracks[1],
    ],
    marks: {
      names: [
        { track: 0, x: 1, y: 0, text: 'Dt1' },
        { track: 1, x: 0, y: 0, text: 'P1' },
      ],
      spans: [{ from: 0, to: 1, text: 'block' }],
      positions: [{ track: 0, x: 1, y: 0, inGene: true, text: 'R166W' }],
    },
  };
  const svg = drawMicroFigure(marked, document, measure);
  const of = (kind: string) =>
    Array.from(svg.querySelectorAll(`[data-mark="${kind}"]`));
  const geneAt = (name: string) => {
    const [gx, gy] = position(svg.querySelector(`[data-gene="${name}"]`));
    return { x: gx, y: gy };
  };
  const pathYs = (e: Element) =>
    e
      .getAttribute('d')
      .match(/-?[\d.]+,-?[\d.]+/g)
      .map((p) => Number(p.split(',')[1]));

  it('emphasises a gene with a heavier black outline', () => {
    const style = svg
      .querySelector('[data-gene="q2"]')
      .firstElementChild.getAttribute('style');
    expect(style).toContain('stroke: #000000; stroke-width: 1.2px');
  });

  it('names a first-track gene above the tracks, led to the dot on it by a hairline', () => {
    const q2 = geneAt('q2');
    const [name] = of('name');
    expect(name.getAttribute('style')).toContain('font-style: italic');
    expect(Number(name.getAttribute('x'))).toBeCloseTo(q2.x, 1);
    const [leader] = of('leader');
    const ys = pathYs(leader);
    const dot = svg.querySelector('circle[data-mark="position"]');
    const dotTop =
      Number(dot.getAttribute('cy')) - Number(dot.getAttribute('r'));
    expect(Math.min(...ys)).toBeGreaterThan(Number(name.getAttribute('y')));
    // it stops short of the dot, which stands on the gene
    expect(Math.max(...ys)).toBeLessThan(dotTop);
    expect(dotTop).toBeLessThan(q2.y);
  });

  it('names a gene in another track just above it, without a leader', () => {
    const p1 = geneAt('p1');
    const name = of('name').find((n) => n.textContent === 'P1');
    expect(Number(name.getAttribute('x'))).toBeCloseTo(p1.x, 1);
    expect(Number(name.getAttribute('y'))).toBeLessThan(p1.y);
    expect(of('leader')).toHaveLength(1);
  });

  it('rules a span over its columns above the names, its text above the rule', () => {
    const [rule, text] = of('span');
    const [x1, x2] = rule
      .getAttribute('d')
      .match(/M(-?[\d.]+),[\d.]+L(-?[\d.]+)/)
      .slice(1)
      .map(Number);
    expect(x1).toBeLessThan(geneAt('q1').x);
    expect(x2).toBeGreaterThan(geneAt('q2').x);
    const ruleY = pathYs(rule)[0];
    expect(Number(text.getAttribute('y'))).toBeLessThan(ruleY);
    expect(ruleY).toBeLessThan(Number(of('name')[0].getAttribute('y')));
  });

  it('marks a position with a dot on a stem that stands above its gene', () => {
    const q2 = geneAt('q2');
    const stem = of('position').find((e) => e.tagName === 'path');
    expect(Math.max(...pathYs(stem))).toBeLessThan(q2.y);
    const label = of('position').find((e) => e.tagName === 'text');
    expect(label.textContent).toBe('R166W');
    expect(Number(label.getAttribute('x'))).toBeGreaterThan(q2.x);
  });

  it('draws no marks layer for a figure without marks', () => {
    expect(draw().querySelector('[data-marks]')).toBeNull();
  });
});
