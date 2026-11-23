import {
  Annotation,
  annotationID,
  parseAnnotations,
  serializeAnnotation,
  serializeAnnotations,
} from './grammar';

// Annotations live in shared links: the parameter must read back exactly
// what was written, whatever the labels hold, and a hand-edited link must
// lose only the item it broke.
describe('the annot parameter', () => {
  const all: Annotation[] = [
    {
      kind: 'box',
      columns: [{ name: 'Glyma.19G194300' }, { name: 'Glyma.19G194500' }],
      tracks: '*',
      text: 'Dt1–GmSW19',
    },
    {
      kind: 'box',
      columns: [{ name: 'a' }, { name: 'b' }],
      tracks: [{ name: 'p1' }, { name: 'v1', source: 'lis' }],
      style: 'accent',
    },
    { kind: 'box', columns: [{ name: 'a' }, { name: 'b' }], tracks: 'q' },
    { kind: 'gap', column: { name: 'q3' }, track: { name: 'p2' } },
    { kind: 'note', gene: { name: 'q2' }, text: 'R166W, a (missense) site' },
    {
      kind: 'note',
      column: { name: 'q3' },
      track: { name: 'p2' },
      text: '50% = lost?; maybe',
      cl: { name: 'Glyma.19G194300' },
    },
    { kind: 'head', columns: [{ name: 'q1' }], text: 'Dt1' },
    {
      kind: 'head',
      columns: [{ name: 'q1' }, { name: 'q4' }],
      text: 'Rückkreuzung ~ 1+1 @ 2',
    },
    {
      kind: 'site',
      at: { chromosome: 'glyma.Wm82.gnm2.Gm19', start: 45183701 },
      text: 'R166W',
    },
    {
      kind: 'site',
      at: { chromosome: 'glyma.Wm82.gnm2.Gm19', start: 10, end: 20 },
    },
  ];

  it('reads back every kind, whatever its labels hold', () => {
    expect(parseAnnotations(serializeAnnotations(all))).toEqual({
      annotations: all,
      rejected: [],
    });
  });

  it('reads the reference figure as written by hand', () => {
    const { annotations, rejected } = parseAnnotations(
      'box(c=Glyma.19G194300~Glyma.19G194500,x=Dt1%E2%80%93GmSW19);head(c=Glyma.19G194300,x=Dt1);site(at=glyma.Wm82.gnm2.Gm19:45183701,x=R166W)',
    );
    expect(rejected).toEqual([]);
    expect(annotations.map((a) => a.kind)).toEqual(['box', 'head', 'site']);
    expect(annotations[0].text).toBe('Dt1–GmSW19');
  });

  it('keeps the items it can read and reports the rest', () => {
    expect(
      parseAnnotations(
        [
          'box(c=a~b)',
          'box(c=a)',
          'circle(c=a)',
          'gap(c=a)',
          'note(g=a)',
          'head(c=a)',
          'site(at=Gm19:0)',
          'site(at=Gm19:20-10)',
          'box(c=a~b,c=a~b)',
          'box(c=a~b,z=1)',
          'note(g=a,x=%E2%80)',
          'note(g=a,c=b,t=c,x=y)',
          'gap(c=a,t=b)',
        ].join(';'),
      ),
    ).toEqual({
      annotations: [
        { kind: 'box', columns: [{ name: 'a' }, { name: 'b' }], tracks: '*' },
        { kind: 'gap', column: { name: 'a' }, track: { name: 'b' } },
      ],
      rejected: [
        'box(c=a)',
        'circle(c=a)',
        'gap(c=a)',
        'note(g=a)',
        'head(c=a)',
        'site(at=Gm19:0)',
        'site(at=Gm19:20-10)',
        'box(c=a~b,c=a~b)',
        'box(c=a~b,z=1)',
        'note(g=a,x=%E2%80)',
        'note(g=a,c=b,t=c,x=y)',
      ],
    });
  });

  it('gives each annotation an ID of its own, kept when others move', () => {
    const ids = all.map(annotationID);
    expect(new Set(ids).size).toBe(all.length);
    const reordered = parseAnnotations(
      serializeAnnotations([...all].reverse().slice(1)),
    ).annotations.map(annotationID);
    expect(reordered).toEqual(ids.slice(0, -1).reverse());
  });

  it('writes the default tracks of a box as nothing', () => {
    expect(serializeAnnotation(all[2])).toBe('box(c=a~b,t=q)');
    expect(
      serializeAnnotation({
        kind: 'box',
        columns: [{ name: 'a' }, { name: 'b' }],
        tracks: '*',
      }),
    ).toBe('box(c=a~b)');
  });
});
