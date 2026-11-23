// Places a genomic position on a drawn track. Genes are drawn at consensus
// columns, not at positions, so a position is placed through the track's own
// genes: inside a gene at the gene's column, between two genes in proportion
// to its distance from each. This holds on inverted tracks, where columns
// fall as positions rise, and beside inserted genes, whose columns are
// fractional. A position beyond the genes is not drawn.

export type PlacedGene = { fmin: number; fmax: number; x: number };

export type PlacedPosition = {
  x: number;
  // the side a position beyond the track's genes lies on
  clipped?: 'left' | 'right';
};

// undefined when the track has no gene with coordinates
export function positionToColumn(
  genes: PlacedGene[],
  position: number,
): PlacedPosition | undefined {
  const located = genes
    .filter((g) => !(g.fmin === 0 && g.fmax === 0))
    .sort((a, b) => a.fmin - b.fmin || a.fmax - b.fmax);
  if (located.length === 0) return undefined;
  const inside = located.find((g) => g.fmin <= position && position <= g.fmax);
  if (inside !== undefined) return { x: inside.x };
  const first = located[0];
  const last = located[located.length - 1];
  // beyond the ends: at the end gene, pointing away from the others
  const away = (end: PlacedGene, next: PlacedGene | undefined) =>
    next === undefined || end.x === next.x
      ? undefined
      : end.x < next.x
        ? 'left'
        : 'right';
  if (position < first.fmin) {
    return { x: first.x, clipped: away(first, located[1]) ?? 'left' };
  }
  if (position > Math.max(...located.map((g) => g.fmax))) {
    return {
      x: last.x,
      clipped: away(last, located[located.length - 2]) ?? 'right',
    };
  }
  // between two genes: the last that ends before it and the next to start
  const before = located
    .filter((g) => g.fmax < position)
    .reduce((a, b) => (b.fmax > a.fmax ? b : a));
  const after = located.find((g) => g.fmin > position);
  const fraction = (position - before.fmax) / (after.fmin - before.fmax);
  return { x: before.x + fraction * (after.x - before.x) };
}
