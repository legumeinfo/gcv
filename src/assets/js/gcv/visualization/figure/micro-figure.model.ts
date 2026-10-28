// A micro-synteny figure as the renderer draws it: every track, gene, rail,
// color and label already chosen, so drawing makes no decision about the
// data. The app builds it from the view and the figure's spec.

export type FigureGeneStyle =
  // a family with its own color
  | 'colour'
  // a family with other genes in the figure, not colored
  | 'neutral'
  // a family with no other gene in the figure
  | 'hollow'
  // a gene without a family
  | 'orphan';

export type FigureGene = {
  name: string;
  // the name drawn under the glyph
  label: string;
  family: string;
  // consensus column, fractional for an inserted gene, and row in its track
  x: number;
  y: number;
  fmin: number;
  fmax: number;
  // the strand as drawn: the gene's, times its alignment's orientation
  strand?: number;
  // 'circle' for a family the search omitted
  glyph?: string;
  style: FigureGeneStyle;
  fill: string;
  // the legend number of a colored family
  key?: number;
  pinned: boolean;
};

// A rail joins two of a track's genes, given by index, or runs from a gene to
// the figure's edge when its neighbor lies outside the columns shown.
export type FigureRail = {
  from: number;
  to: number | 'left' | 'right';
  // the two genes' coordinates, which set the rail's thickness
  ends: [{ fmin: number; fmax: number }, { fmin: number; fmax: number }];
};

export type FigureTrack = {
  role: 'query' | 'result';
  // drawn in italics, then the rest of the label
  binomial: string;
  locus: string;
  genes: FigureGene[];
  rails: FigureRail[];
};

export type FigureLegendEntry = {
  style: FigureGeneStyle;
  fill: string;
  key?: number;
  label: string;
};

export type MicroFigure = {
  // the consensus columns shown, as the drawn range
  columns: [number, number];
  tracks: FigureTrack[];
  legend: FigureLegendEntry[] | null;
  // width in mm, label size in pt, glyph size in mm (fitted when absent)
  size: { width: number; font: number; glyph?: number };
  names: boolean;
  famlabels: boolean;
  caption: string;
  printCaption: boolean;
  // written into the SVG's metadata, e.g. the view's URL and parameters
  metadata: Record<string, unknown>;
};
