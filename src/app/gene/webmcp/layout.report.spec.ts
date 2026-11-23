import type { MicroLayout } from '@gcv-assets/js/gcv/visualization/micro';
import { AlignedTrack, clusterAlignments } from '@gcv/gene/alignment';
import { viewLayout } from './layout.report';

function track(
  overrides: Partial<AlignedTrack> & Pick<AlignedTrack, 'name' | 'genes'>,
): AlignedTrack {
  const n = overrides.genes.length;
  return {
    length: 0,
    genus: 'Glycine',
    species: 'max',
    source: 'lis',
    cluster: 0,
    families: ['f1', 'f2', 'f3'].slice(0, n),
    alignment: [...Array(n).keys()],
    orientations: Array(n).fill(1),
    segments: Array(n).fill(0),
    score: 0,
    ...overrides,
  };
}

const query = track({ name: 'Gm01', genes: ['q1', 'q2', 'q3'] });
const result = track({ name: 'Pv01', genes: ['r1', 'r2'], score: 30 });
const [alignment] = clusterAlignments(
  [['f1', 'f2', 'f3']],
  [query, result],
  new Set([query]),
  new Map(),
);

const box = (x: number, y: number) => ({ x, y, width: 10.04, height: 5 });

const drawn: MicroLayout = {
  svg: box(0, 100),
  glyphSize: 30,
  columns: [
    { column: 0, x: 100.04 },
    { column: 1, x: 200 },
    { column: 2, x: 300 },
  ],
  tracks: [
    { index: 0, y: 130, top: 115, height: 30, label: box(5, 125) },
    { index: 1, y: 160, top: 145, height: 30, label: null },
  ],
};

describe('viewLayout', () => {
  it('says what each column and track holds, beside where it is drawn', () => {
    const layout = viewLayout('micro0', drawn, alignment, box(0, 90));
    expect(layout.columns).toEqual([
      { column: 0, family: 'f1', x: 100 },
      { column: 1, family: 'f2', x: 200 },
      { column: 2, family: 'f3', x: 300 },
    ]);
    expect(layout.tracks.map((t) => [t.role, t.chromosome, t.y])).toEqual([
      ['query', 'Gm01', 130],
      ['result', 'Pv01', 160],
    ]);
    expect(layout.tracks[1]).toMatchObject({
      firstGene: 'r1',
      lastGene: 'r2',
      label: null,
    });
    expect(layout.tracks[0].label.width).toBe(10);
    expect(layout).toMatchObject({ panel: 'micro0', cluster: 0 });
  });

  it('gives nothing while the drawing and the alignment disagree', () => {
    const partial = { ...drawn, tracks: drawn.tracks.slice(0, 1) };
    expect(viewLayout('micro0', partial, alignment, box(0, 0))).toBe(undefined);
  });
});
