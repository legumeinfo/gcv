// The figure's caption, written from what the figure shows, so it states
// how the figure was made and how to read it, and holds the link that
// reproduces it.
import { Params } from '@gcv/gene/models/params';
import { FigureManifest } from './model';

export type CaptionContext = {
  // the query genes, and the source they come from
  queryGenes: string[];
  params: Params;
  url: string;
  version: string;
  // an ISO date
  date: string;
};

const list = (items: string[]) =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

// how the caption names each kind of annotation, unlabelled and labelled
const UNLABELLED = {
  box: 'a box',
  gap: 'a dashed empty slot',
  note: 'a note',
  head: 'a column header',
  site: 'a site',
};
const LABELLED = {
  box: 'box',
  gap: 'dashed slot',
  note: 'note',
  head: 'header',
  site: 'site',
};

const annotationPhrase = ({
  kind,
  text,
}: FigureManifest['annotations'][number]) =>
  text === undefined ? UNLABELLED[kind] : `${LABELLED[kind]} “${text}”`;

export function figureCaption(
  manifest: FigureManifest,
  { queryGenes, params, url, version, date }: CaptionContext,
): string {
  const p = params as Record<string, unknown>;
  const { shown, of } = manifest.resultTracks;
  const merged = manifest.tracks.filter((t) => t.mergedWith !== undefined);
  const columns = manifest.columns.crop
    ? `consensus columns ${manifest.columns.from} to ${manifest.columns.to}, from ${manifest.columns.crop[0]} to ${manifest.columns.crop[1]}`
    : 'every consensus column';
  const sentences = [
    `Micro-synteny of the genomic context of ${list(queryGenes)}: ${manifest.tracks.length - shown} query ${manifest.tracks.length - shown === 1 ? 'track' : 'tracks'} and ${shown} of the cluster's ${of} result tracks, showing ${columns}.`,
    'Each row is a genomic region; genes are drawn at the consensus column they aligned to, so genes one above the other correspond, and a triangle points the way a gene reads relative to the alignment (a circle where its strand is unknown or its family was omitted from the search). Line thickness shows the distance between neighboring genes, and a line ending in an arrow continues to genes outside the columns shown.',
    'Colors mark gene families of the data source: each colored family has its own color; grey genes belong to other families with genes in several tracks; white genes have no other gene of their family in the figure; dashed outlines mark genes without a family.',
    ...(manifest.pinned.genes.length + manifest.pinned.families.length > 0
      ? ['Thick outlines mark pinned genes.']
      : []),
    ...(manifest.annotations.length > 0
      ? [`Annotations: ${list(manifest.annotations.map(annotationPhrase))}.`]
      : []),
    ...(merged.length > 0
      ? [
          `Tracks merged as one locus: ${list(merged.map((t) => `${t.chromosome} and ${t.mergedWith}`))}.`,
        ]
      : []),
    ...(p.regexp
      ? [`Genomes shown match the regular expression ${p.regexp}.`]
      : []),
    `Search: sources ${String(p.sources)}, neighbors ${p.neighbors}, matched ${p.matched}, intermediate ${p.intermediate}. Alignment: ${p.algorithm}, match ${p.match}, mismatch ${p.mismatch}, gap ${p.gap}, score ${p.score}, threshold ${p.threshold}. Clustering: ${p.linkage} linkage, threshold ${p.cthreshold}.`,
    `Made with GCV ${version} on ${date}: ${url}`,
  ];
  return sentences.join(' ');
}
