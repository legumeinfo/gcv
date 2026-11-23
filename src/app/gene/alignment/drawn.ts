// a track as the micro-synteny viewer draws it (micro.shim.ts): its aligned
// genes, each at its consensus column and row
export type DrawnGene = {
  name: string;
  family: string;
  x: number;
  y: number;
  fmin: number;
  fmax: number;
  strand?: number;
  glyph?: string;
};

export type DrawnTrack = {
  source: string;
  genus: string;
  species: string;
  chromosome_name: string;
  genes: DrawnGene[];
};
