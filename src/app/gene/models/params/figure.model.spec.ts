import {
  FigureSpec,
  figureParamParsers,
  parseFigureSpec,
  serializeFigureSpec,
} from './figure.model';

// A figure lives in a shared link, so its parameter must read back exactly
// what was written, and a hand-edited link must lose only what it broke.
describe('the fig parameter', () => {
  const spec: FigureSpec = {
    cl: 'Glyma.19G194300',
    top: 20,
    tracks: ['Phvul.002G085200', 'Vigun01g059200'],
    genus: ['Glycine', 'Phaseolus'],
    order: { genera: ['Phaseolus', 'Glycine'] },
    merge: [['Glyma.19G194300', 'glyma.Wm82.gnm2.ann1.Glyma.19G194300']],
    crop: ['Glyma.19G194300', 'Glyma.19G194500'],
    colour: ['legfed_v1_0.L_BLLJZN', 'legfed_v1_0.L_8FXT4Y'],
    famlabels: true,
    labels: 'short',
    names: false,
    w: 85,
    font: 6.5,
    glyph: 2,
    legend: false,
    cap: true,
  };

  it('reads back every key as written', () => {
    expect(parseFigureSpec(serializeFigureSpec(spec))).toEqual({
      spec,
      rejected: [],
    });
  });

  it('writes the keys in a fixed order, whatever the spec’s order', () => {
    expect(serializeFigureSpec({ w: 85, cl: 'g1', top: 3 })).toBe(
      'cl:g1;top:3;w:85',
    );
  });

  it('reads the named orders and merges', () => {
    expect(parseFigureSpec('order:score;merge:both').spec).toEqual({
      order: 'score',
      merge: 'both',
    });
  });

  it('keeps what it can read and reports the rest', () => {
    expect(
      parseFigureSpec('cl:g1;top:0;w:900;crop:g1;bogus:1;labels:tiny;;names:1'),
    ).toEqual({
      spec: { cl: 'g1', names: true },
      rejected: ['top:0', 'w:900', 'crop:g1', 'bogus:1', 'labels:tiny'],
    });
  });

  it('drops empty list items, and rejects a list with none', () => {
    expect(parseFigureSpec('genus:Glycine++Lotus;colour:+').spec).toEqual({
      genus: ['Glycine', 'Lotus'],
    });
    expect(parseFigureSpec('merge:a/b+c').rejected).toEqual(['merge:a/b+c']);
  });

  it('opens a figure with defaults when the parameter is empty', () => {
    expect(figureParamParsers.fig('')).toEqual({});
  });

  it('carries the rejected pairs with the spec', () => {
    expect(figureParamParsers.fig('w:85;top:x')).toEqual({
      w: 85,
      rejected: ['top:x'],
    });
  });

  it('reads back the author’s marks, whatever their text holds', () => {
    const spec = {
      em: ['Glyma.19G194300', 'Glyma.19G194500'],
      name: [
        { gene: 'Glyma.19G194300', text: 'Dt1' },
        { gene: 'Glyma.19G194500', text: 'a;b+c=d~e%f, ü' },
      ],
      span: [
        { from: 'Glyma.19G194300', to: 'Glyma.19G194500', text: 'Dt1–GmSW19' },
        { from: 'g1', to: 'g2' },
      ],
      pos: [
        {
          chromosome: 'glyma.Wm82.gnm2.Gm19',
          position: 45183701,
          text: 'R166W',
        },
        { chromosome: 'Pv01', position: 7 },
      ],
    };
    const written = serializeFigureSpec(spec);
    expect(written).toContain('pos:glyma.Wm82.gnm2.Gm19:45183701=R166W');
    expect(parseFigureSpec(written)).toEqual({ spec, rejected: [] });
  });

  it('rejects a mark it can’t read, keeping the rest', () => {
    const { spec, rejected } = parseFigureSpec(
      'name:g1;span:g1=x;pos:Gm19:abc;em:g2;name:g3=',
    );
    expect(spec).toEqual({ em: ['g2'] });
    expect(rejected).toEqual([
      'name:g1',
      'span:g1=x',
      'pos:Gm19:abc',
      'name:g3=',
    ]);
  });
});
