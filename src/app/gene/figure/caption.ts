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
    'Each row is a genomic region, the query first, labeled with its chromosome and the span drawn in Mb, given high to low where the region aligned in reverse (rev.).',
    'Genes are placed by aligned position, not to scale: genes one above the other aligned to the same consensus column, and a triangle points the way a gene reads relative to the alignment (a circle where its strand is unknown or its family was omitted from the search). Line thickness shows the distance between neighboring genes, and a line ending in dots continues to genes outside the columns shown.',
    'Colors mark gene families of the data source: each colored family has its own color; grey genes belong to other families shared between tracks; white genes are the only gene of their family in the figure; dashed outlines mark genes without a family.',
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
