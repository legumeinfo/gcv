// WebMCP tools that read genes, gene families and dot plots of the gene view.
import { inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
// store
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import * as fromFamily from '@gcv/gene/store/selectors/family';
import * as fromPlots from '@gcv/gene/store/selectors/plots';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { AppConfig } from '@gcv/core/models';
import {
  GcvWebMcpTools,
  WebMcpToolError,
  defineGcvWebMcpTool,
} from '@gcv/core/webmcp/webmcp';
import { Plot } from '@gcv/gene/models';
import { GeneService, RegionService } from '@gcv/gene/services';
import { familiesReport, familyMembers } from './families.report';
import {
  checkCluster,
  settledView,
  viewContext,
  viewGenes,
  viewTracks,
} from './gene-view.context';
import { matchGeneName, resolveTrack, trackLabel } from './lookup';
import { dotPlotReport } from './plots.report';
import { AlignedTrack } from './view-state';

type Link = { text: string; href: string };

// a linkout service's reply, reduced to links; its text is untrusted
async function linkouts(
  request: () => Observable<unknown>,
): Promise<{ links: Link[] } | { error: string }> {
  try {
    const reply = await firstValueFrom(request());
    const links = (Array.isArray(reply) ? reply : [])
      .filter((l) => typeof l?.href === 'string')
      .map((l) => ({ text: String(l.text ?? ''), href: l.href }));
    return { links };
  } catch (error) {
    return { error: error?.message ?? String(error) };
  }
}

// the view's tracks, or those of one cluster
async function clusterTracks(
  context: ReturnType<typeof viewContext>,
  cluster?: number,
): Promise<{ queryTracks: AlignedTrack[]; tracks: AlignedTrack[] }> {
  const { queryTracks, tracks } = await viewTracks(context);
  if (cluster === undefined) {
    return { queryTracks, tracks };
  }
  checkCluster(tracks, cluster);
  const inCluster = (t: AlignedTrack) => t.cluster === cluster;
  return {
    queryTracks: queryTracks.filter(inCluster),
    tracks: tracks.filter(inCluster),
  };
}

const getGeneDetails = defineGcvWebMcpTool({
  name: 'get_gene_details',
  title: 'Get gene details',
  description:
    "Reports a gene's family, chromosome, coordinates and strand, the micro-synteny tracks of the view that hold it, and the links its data source offers for it and its genomic region (e.g. genome browsers, gene pages, family phylograms). The links and their text come from the data source's linkout service, not from GCV.",
  inputSchema: {
    type: 'object',
    properties: {
      gene: {
        type: 'string',
        description:
          "Gene name (e.g. 'glyma.Wm82.gnm4.ann1.Glyma.12G040000'); for a gene in the view, the unprefixed name ('Glyma.12G040000') also works when unambiguous.",
      },
      source: {
        type: 'string',
        description:
          'Data source of the gene; required for a gene outside the view when several sources are configured.',
      },
    },
    required: ['gene'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: async ({ gene, source }, { signal }) => {
    const context = viewContext();
    const appConfig = inject(AppConfig);
    const geneService = inject(GeneService);
    const regionService = inject(RegionService);
    const { tracks } = await viewTracks(context);
    const candidates = tracks.filter(
      (t) => source === undefined || t.source === source,
    );
    const matches = matchGeneName(
      candidates.flatMap((t) => t.genes),
      gene,
    );
    if (matches.length > 1) {
      throw new WebMcpToolError(
        `${gene} is ambiguous in this view: ${matches.join(', ')}. Pass the full name.`,
      );
    }
    const name = matches[0] ?? gene;
    let geneSource = source;
    if (geneSource === undefined) {
      const holders = candidates.filter((t) => t.genes.includes(name));
      const servers = appConfig.servers.filter((s) => s.genes !== undefined);
      if (holders.length > 0) {
        geneSource = holders[0].source;
      } else if (servers.length === 1) {
        geneSource = servers[0].id;
      } else {
        throw new WebMcpToolError(
          `${gene} is not in the view; pass its source, one of ${servers.map((s) => s.id).join(', ')}.`,
        );
      }
    }
    const server = appConfig.getServer(geneSource);
    if (server === undefined) {
      throw new WebMcpToolError(
        `${geneSource} is not a data source; choose from ${appConfig.getServerIDs().join(', ')}.`,
      );
    }
    const genes = await viewGenes(
      context,
      [{ names: [name], source: geneSource }],
      signal,
    );
    const record = genes.get(geneID(name, geneSource));
    if (record === undefined) {
      throw new WebMcpToolError(
        `${server.name} has no gene ${name}. Call search_genes_and_regions to find its exact name.`,
      );
    }
    const [geneLinks, regionLinks] = await Promise.all([
      linkouts(() => geneService.getGeneDetails(name, geneSource)),
      linkouts(() =>
        regionService.getRegionDetails(
          record.chromosome,
          record.fmin,
          record.fmax,
          geneSource,
        ),
      ),
    ]);
    const familyTreeLink =
      server.familyTreeLink !== undefined && record.family !== ''
        ? server.familyTreeLink.url + record.family
        : undefined;
    return {
      gene: name,
      source: geneSource,
      family: record.family === '' ? null : record.family,
      chromosome: record.chromosome,
      fmin: record.fmin,
      fmax: record.fmax,
      strand: record.strand,
      inView: tracks
        .filter((t) => t.source === geneSource && t.genes.includes(name))
        .map(trackLabel),
      familyTreeLink,
      geneLinks,
      regionLinks,
    };
  },
});

const getFamilySummary = defineGcvWebMcpTool({
  name: 'get_family_summary',
  title: 'Get gene family summary',
  description:
    "Summarizes the gene families in the micro-synteny view. For each family with two or more genes in the view: its gene count, how many tracks hold it and the most copies on one track, how many tandem arrays (adjacent copies on a track) it forms, genes per species, whether a query track holds it, and its color in the viewers. Also lists the singleton families (one gene in the view) and counts the orphans (genes without a family). Copy number differences across species and tandem arrays point to gene family expansion or loss; compare per-species counts against the species' track counts. With 'family', lists that family's genes on every track instead.",
  inputSchema: {
    type: 'object',
    properties: {
      cluster: {
        type: 'integer',
        minimum: 0,
        description: 'Only this cluster (default: every cluster).',
      },
      family: {
        type: 'string',
        description: "One family's genes per track.",
      },
      maxFamilies: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
        description:
          'Most families to report, by gene count, most first (default 100).',
      },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  execute: async ({ cluster, family, maxFamilies = 100 }, { signal }) => {
    const context = viewContext();
    await settledView(context, signal);
    const { queryTracks, tracks } = await clusterTracks(context, cluster);
    const omitted = await firstValueFrom(
      context.store.select(fromFamily.selectOmittedFamilies),
    );
    // the viewers color a family unless it has one gene among all tracks
    const { tracks: allTracks } = await viewTracks(context);
    const sizes = new Map<string, number>();
    allTracks.forEach((t) =>
      t.families.forEach((f) => sizes.set(f, (sizes.get(f) ?? 0) + 1)),
    );
    const colors = GCV.common.colors;
    const color = (f: string) =>
      sizes.get(f) > 1 && colors.domain().includes(f)
        ? (colors(f) as string)
        : null;
    const report = familiesReport(tracks, queryTracks, { omitted, color });
    if (family !== undefined) {
      const members = familyMembers(tracks, queryTracks, family);
      if (members.tracks.length === 0) {
        throw new WebMcpToolError(
          `No gene of family ${family} is in the ${cluster === undefined ? 'view' : `cluster ${cluster}`}.`,
        );
      }
      return {
        url: context.url(),
        ...members,
        summary: report.familyReports.find((r) => r.family === family) ?? {
          singleton: true,
        },
      };
    }
    const { familyReports, ...rest } = report;
    return {
      url: context.url(),
      ...rest,
      familyReports: familyReports.slice(0, maxFamilies),
      omittedFamilyReports: Math.max(0, familyReports.length - maxFamilies),
    };
  },
});

const getDotPlotPairs = defineGcvWebMcpTool({
  name: 'get_dot_plot_pairs',
  title: 'Get dot plot pairs',
  description:
    "Reads the dot plots of a micro-synteny track: every pair of same-family genes between the track and a reference, with the genes' positions. A 'local' plot compares the track with each query track of its cluster; a 'global' plot with each whole query chromosome, which finds homologs of the track's genes beyond the query neighborhood. Each plot reports Spearman's rank correlation of the pair positions: near 1 is a collinear (syntenic) arrangement, near -1 an inverted one, near 0 none. Name the track by chromosome; add cluster, a gene on it, or source when the chromosome has several tracks.",
  inputSchema: {
    type: 'object',
    properties: {
      chromosome: {
        type: 'string',
        description:
          "Chromosome of the track (e.g. 'phavu.G19833.gnm2.Chr02'); the unprefixed name ('Chr02') also works.",
      },
      cluster: { type: 'integer', minimum: 0 },
      gene: { type: 'string', description: 'A gene on the track.' },
      source: { type: 'string' },
      type: {
        type: 'string',
        enum: ['local', 'global'],
        description: "Plot type (default 'local').",
      },
      maxPairs: {
        type: 'integer',
        minimum: 1,
        maximum: 5000,
        description: 'Most pairs to list per plot (default 200).',
      },
    },
    required: ['chromosome'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  execute: async (
    { chromosome, cluster, gene, source, type = 'local', maxPairs = 200 },
    { signal },
  ) => {
    const context = viewContext();
    await settledView(context, signal);
    const { tracks } = await viewTracks(context);
    const track = resolveTrack(tracks, { chromosome, cluster, gene, source });
    const selector =
      type === 'local'
        ? fromPlots.getLocalPlots(track)
        : fromPlots.getGlobalPlots(track);
    const plots: Plot[] = await firstValueFrom(context.store.select(selector));
    const requests = plots.flatMap((p) =>
      Object.entries(p.sourceGeneMap()).map(([source, names]) => ({
        names,
        source,
      })),
    );
    const genes = await viewGenes(context, requests, signal);
    return {
      url: context.url(),
      track: trackLabel(track),
      type,
      plots: plots.map((p) => dotPlotReport(p, genes, maxPairs)),
    };
  },
});

// the tools that read genes, families and dot plots, in the order agents use
// them
export const inspectWebMcpTools = (): GcvWebMcpTools => [
  getFamilySummary,
  getDotPlotPairs,
  getGeneDetails,
];
