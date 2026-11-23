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

// the author's marks, in words, so the caption reads without the figure
function marksSentences(marks: FigureManifest['marks']): string[] {
  const quoted = (text?: string) => (text !== undefined ? `“${text}” ` : '');
  return [
    ...(marks.emphasised.length > 0
      ? [`Heavier outlines mark ${list(marks.emphasised)}.`]
      : []),
    ...(marks.names.length > 0
      ? [
          `Italic names label ${list(marks.names.map((n) => `${n.gene} (${n.text})`))}.`,
        ]
      : []),
    ...(marks.spans.length > 0
      ? [
          `A rule above the tracks marks ${list(marks.spans.map((sp) => `${quoted(sp.text)}columns ${sp.columns[0]} to ${sp.columns[1]}, from ${sp.from} to ${sp.to}`))}.`,
        ]
      : []),
    ...(marks.positions.length > 0
      ? [
          `A dot on a stem marks ${list(marks.positions.map((p) => `${quoted(p.text)}${p.chromosome}:${p.position.toLocaleString('en-US')}`))}, placed among the genes of each track on that chromosome.`,
        ]
      : []),
  ];
}

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
    ...marksSentences(manifest.marks),
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
