// The micro-synteny viewer's layout as agents read it: where each consensus
// column, track, label and annotation is drawn, in the page's viewport
// coordinates, with what each column and track holds, so an agent can point
// at a screenshot without measuring it.
import type { MicroLayout } from '@gcv-assets/js/gcv/visualization/micro';
import { ClusterAlignment } from '@gcv/gene/alignment';

type Box = { x: number; y: number; width: number; height: number };

export type ViewLayout = {
  panel: string;
  cluster: number;
  // the panel's visible area; anything outside it is scrolled out of view
  visible: Box;
  svg: Box;
  glyphSize: number;
  columns: { column: number; family: string | null; x: number }[];
  tracks: {
    index: number;
    role: 'query' | 'result';
    chromosome: string;
    source: string;
    firstGene: string;
    lastGene: string;
    // the center of the track's first row, and its extent
    y: number;
    top: number;
    height: number;
    label: Box | null;
  }[];
  annotations: { id: string; kind: string; box: Box }[];
};

const round = (n: number) => Math.round(n * 10) / 10;

const roundBox = (b: Box): Box => ({
  x: round(b.x),
  y: round(b.y),
  width: round(b.width),
  height: round(b.height),
});

// undefined when the drawing and the alignment disagree, as while the view
// redraws
export function viewLayout(
  panel: string,
  layout: MicroLayout,
  alignment: ClusterAlignment,
  visible: Box,
): ViewLayout | undefined {
  if (layout.tracks.length !== alignment.tracks.length) return undefined;
  return {
    panel,
    cluster: alignment.cluster,
    visible: roundBox(visible),
    svg: roundBox(layout.svg),
    glyphSize: layout.glyphSize,
    columns: layout.columns.map(({ column, x }) => ({
      column,
      family: alignment.consensus[column] ?? null,
      x: round(x),
    })),
    tracks: layout.tracks.map((t) => {
      const track = alignment.tracks[t.index];
      return {
        index: t.index,
        role: track.role,
        chromosome: track.chromosome,
        source: track.source,
        firstGene: track.genes[0]?.name,
        lastGene: track.genes[track.genes.length - 1]?.name,
        y: round(t.y),
        top: round(t.top),
        height: round(t.height),
        label: t.label === null ? null : roundBox(t.label),
      };
    }),
    annotations: layout.annotations.map((a) => ({
      ...a,
      box: roundBox(a.box),
    })),
  };
}
