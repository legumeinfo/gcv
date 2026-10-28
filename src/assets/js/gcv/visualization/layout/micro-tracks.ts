// The micro-synteny layout as pure functions of the viewer's data, so every
// renderer of micro-synteny tracks places genes, rows, rails and labels the
// same way. A gene's x is its consensus column, fractional for a gene
// inserted between columns; its y is the row of its track it is drawn on.

export type MicroGene = {
  name: string;
  family: string;
  x: number;
  y: number;
  fmin: number;
  fmax: number;
  strand?: number;
  reversed?: boolean;
  glyph?: string;
};

export type MicroTrack = {
  chromosome_name: string;
  genus: string;
  species: string;
  genes: MicroGene[];
};

// the rows each track occupies
export function trackLevels(tracks: MicroTrack[]): number[] {
  return tracks.map((t) => Math.max(...t.genes.map((g) => g.y)) + 1);
}

// the first row of each track
export function trackTicks(levels: number[]): number[] {
  const ticks = [];
  let tick = 0;
  levels.forEach((l) => {
    ticks.push(tick);
    tick += l;
  });
  return ticks;
}

// the genomic span of a track's drawn genes
export function trackInterval(track: MicroTrack): [number, number] {
  const ends = track.genes.flatMap((g) => [g.fmin, g.fmax]);
  return [Math.min(Infinity, ...ends), Math.max(-Infinity, ...ends)];
}

export function trackLabel(track: MicroTrack, prefix = ''): string {
  const [fmin, fmax] = trackInterval(track);
  return `${prefix}${track.chromosome_name}:${fmin}-${fmax}`;
}

// the distance between each pair of consecutive genes, which sets the
// thickness of the rail between them
export function neighborDistances(track: MicroTrack): number[] {
  return track.genes.slice(1).map((next, j) => {
    const { fmin, fmax } = track.genes[j];
    return Math.min(
      Math.abs(fmin - next.fmin),
      Math.abs(fmax - next.fmin),
      Math.abs(fmin - next.fmax),
      Math.abs(fmax - next.fmax),
    );
  });
}

// the columns the tracks span
export function columnDomain(tracks: MicroTrack[]): [number, number] {
  const xs = tracks.flatMap((t) => t.genes.map((g) => g.x));
  return [Math.min(...xs), Math.max(...xs)];
}

// A rail is drawn left to right from its left gene, inside a box of the given
// height: these are its ends' offsets from the box's top.
export function railOffsets(
  a: MicroGene,
  b: MicroGene,
  height: number,
): [number, number] {
  const descends = a.x <= b.x ? a.y < b.y : a.y > b.y;
  return descends ? [0, height] : [height, 0];
}

// A triangle points the way the gene reads in the drawn track: right for the
// forward strand, left for the reverse, flipped when the track is reversed. A
// gene without a known strand, or whose family the search omitted, is a circle.
export function glyphShape(gene: MicroGene): 'circle' | 'triangle' {
  return gene.glyph === 'circle' || gene.strand === undefined
    ? 'circle'
    : 'triangle';
}

export function glyphRotation(gene: MicroGene): 90 | -90 {
  const reverse =
    (gene.strand === -1 && !gene.reversed) ||
    (gene.strand === 1 && gene.reversed);
  return reverse ? -90 : 90;
}
