// WebMCP tools for the gene view. They exist while the view is open: the view
// declares them in its injection context, so they unregister when it closes.
import { DOCUMENT, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
// store
import * as fromRoot from '@gcv/store/reducers';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import {
  GcvWebMcpTools,
  WebMcpJsonSchema,
  WebMcpToolError,
  declareGcvWebMcpTool,
  defineGcvWebMcpTool,
  waitFor,
} from '@gcv/core/webmcp/webmcp';
import { Params } from '@gcv/gene/models/params';
import {
  PairwiseBlocksService,
  ParamsService,
  ProcessService,
} from '@gcv/gene/services';
import {
  ClusterAlignment,
  clusterAlignmentTsv,
  clusterAlignments,
  syntenicCounterparts,
} from './alignment.report';
import { blockEndpointGenes, macroSyntenyReport } from './blocks.report';
import { parameterSchemas, validateParameterUpdate } from './parameters';
import {
  AlignedTrack,
  GeneViewSummary,
  currentGeneView,
  loadGenes,
  waitForSettledGeneView,
} from './view-state';

const SETTLE_TIMEOUT_MS = 60_000;

// inject() only works before a tool's first await, so tools take everything
// they need up front
type ViewContext = {
  store: Store<fromRoot.State>;
  url: () => string;
};

function viewContext(): ViewContext {
  const document = inject(DOCUMENT);
  return {
    store: inject<Store<fromRoot.State>>(Store),
    url: () => document.location.href,
  };
}

// waits for the view to settle and fails when it has nothing to report on
async function settledView(
  { store }: ViewContext,
  signal: AbortSignal,
): Promise<GeneViewSummary> {
  const summary = await waitForSettledGeneView(store, {
    signal,
    timeoutMs: SETTLE_TIMEOUT_MS,
  });
  if (summary.status === 'empty' || summary.clusters.length === 0) {
    throw new WebMcpToolError(
      'The view has no loaded query genes. Call show_gene_contexts with genes from search_genes_and_regions first.' +
        (summary.issues.length > 0
          ? ` Issues: ${summary.issues.join('; ')}`
          : ''),
    );
  }
  return summary;
}

function geneRequests(tracks: AlignedTrack[]) {
  return geneActions.tracksToGetGeneActions(tracks).map((a) => a.payload);
}

// the aligned tracks of the view, in the viewer's order, with gene positions
async function alignments(
  { store }: ViewContext,
  signal: AbortSignal,
  cluster?: number,
): Promise<ClusterAlignment[]> {
  const query = await firstValueFrom(
    store.select(fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
  );
  let tracks = await firstValueFrom(
    store.select(fromMicroTracks.getAllClusteredAndAlignedMicroTracks),
  );
  if (cluster !== undefined) {
    tracks = tracks.filter((t) => t.cluster === cluster);
    if (tracks.length === 0) {
      const ids = Array.from(new Set(query.tracks.map((t) => t.cluster)));
      throw new WebMcpToolError(
        `No cluster ${cluster}; the view has clusters ${ids.join(', ')}.`,
      );
    }
  }
  const genes = await loadGenes(
    store,
    geneRequests(tracks),
    (request) => store.dispatch(geneActions.get(request)),
    { signal, timeoutMs: SETTLE_TIMEOUT_MS },
  );
  return clusterAlignments(
    query.consensuses,
    tracks,
    new Set(query.tracks),
    genes,
  );
}

// keeps a cluster's query tracks and its first maxTracks result tracks
function limitTracks(cluster: ClusterAlignment, maxTracks: number) {
  const results = cluster.tracks.filter((t) => t.role === 'result');
  return {
    cluster: {
      ...cluster,
      tracks: [
        ...cluster.tracks.filter((t) => t.role === 'query'),
        ...results.slice(0, maxTracks),
      ],
    },
    omittedResultTracks: Math.max(0, results.length - maxTracks),
  };
}

const getViewStatus = defineGcvWebMcpTool({
  name: 'get_view_status',
  title: 'Get gene view status',
  description:
    'Reports the gene view: its query genes and whether each loaded, the clusters of query tracks (one micro-synteny viewer each), the status of each data source search per cluster, the number of aligned result tracks, every parameter value, any issues, and the shareable URL. By default it first waits for loading to finish.',
  inputSchema: {
    type: 'object',
    properties: {
      wait: {
        type: 'boolean',
        description:
          'Wait until every pending request has finished (default true).',
      },
      timeoutSeconds: {
        type: 'integer',
        minimum: 1,
        maximum: 300,
        description: 'Longest wait, in seconds (default 60).',
      },
    },
  },
  annotations: { readOnlyHint: true },
  execute: async ({ wait = true, timeoutSeconds = 60 }, { signal }) => {
    const { store, url } = viewContext();
    const summary = wait
      ? await waitForSettledGeneView(store, {
          signal,
          timeoutMs: timeoutSeconds * 1000,
        })
      : await currentGeneView(store);
    return { url: url(), ...summary };
  },
});

const setViewParameters = defineGcvWebMcpTool({
  name: 'set_view_parameters',
  title: 'Set gene view parameters',
  description:
    'Changes analysis and display parameters of the gene view: the query neighborhood size, micro-synteny search sensitivity, clustering, alignment scoring, result filters and order, macro-synteny block criteria, and data sources. Parameters left out keep their values. The change is recorded in the URL, so the returned URL reproduces the view. Waits for the view to reload and returns what changed with the new view status.',
  inputSchema: {
    type: 'object',
    properties: parameterSchemas() as unknown as Record<
      string,
      WebMcpJsonSchema
    >,
    additionalProperties: false,
  },
  execute: async (args, { signal }) => {
    const { store, url } = viewContext();
    const paramsService = inject(ParamsService);
    const { params, errors } = validateParameterUpdate(
      args as Record<string, unknown>,
    );
    if (errors.length > 0) {
      throw new WebMcpToolError(
        `No parameters changed. Invalid: ${errors.join('; ')}`,
      );
    }
    const current: Params = await firstValueFrom(
      store.select(fromParams.getParams),
    );
    const same = (key: string, value: unknown) =>
      JSON.stringify(current[key]) === JSON.stringify(value);
    const changed = {};
    Object.entries(params)
      .filter(([key, value]) => !same(key, value))
      .forEach(([key, value]) => {
        changed[key] = { from: current[key], to: value };
      });
    if (Object.keys(changed).length > 0) {
      paramsService.updateParams(params as Params);
      const applied = await waitFor(
        store.select(fromParams.getParams),
        (p) =>
          Object.entries(params).every(
            ([key, value]) => JSON.stringify(p[key]) === JSON.stringify(value),
          ),
        { signal, timeoutMs: SETTLE_TIMEOUT_MS },
      );
      if (applied.timedOut) {
        throw new WebMcpToolError(
          'The parameters were not applied; the URL may have been rejected. Call get_view_status to see the current parameters.',
        );
      }
    }
    const view = await waitForSettledGeneView(store, {
      signal,
      timeoutMs: SETTLE_TIMEOUT_MS,
    });
    return { changed, url: url(), view };
  },
});

const getMicrosyntenyAlignment = defineGcvWebMcpTool({
  name: 'get_microsynteny_alignment',
  title: 'Get micro-synteny alignment',
  description:
    "Reads the micro-synteny alignment the view computed. Each cluster of query tracks has a consensus sequence of gene families; every query and result track is aligned to it, so genes in the same consensus column correspond positionally across species and genomes. 'summary' reports, per track, its species, chromosome, span, alignment score, and how many genes aligned, matched the consensus family, aligned inverted, or fell in separate segments. 'genes' adds every gene with its family, column (or, for a gene inserted between columns, the column it follows), alignment orientation, strand and coordinates. 'tsv' gives one row per track and one column per consensus position; a cell holds the aligned gene, then genes inserted after it marked '+', with ' (-)' marking inverted alignment. Results follow the view's current filter and order.",
  inputSchema: {
    type: 'object',
    properties: {
      cluster: {
        type: 'integer',
        minimum: 0,
        description: 'Only this cluster (default: every cluster).',
      },
      format: {
        type: 'string',
        enum: ['summary', 'genes', 'tsv'],
        description: "Level of detail (default 'summary').",
      },
      maxTracks: {
        type: 'integer',
        minimum: 1,
        maximum: 500,
        description:
          'Most result tracks to report per cluster, in view order (default 50); query tracks are always reported.',
      },
    },
  },
  annotations: { readOnlyHint: true },
  execute: async (
    { cluster, format = 'summary', maxTracks = 50 },
    { signal },
  ) => {
    const context = viewContext();
    await settledView(context, signal);
    const limited = (await alignments(context, signal, cluster)).map((c) =>
      limitTracks(c, maxTracks),
    );
    if (format === 'tsv') {
      return limited
        .map(({ cluster }) => clusterAlignmentTsv(cluster))
        .join('\n\n');
    }
    return {
      url: context.url(),
      clusters: limited.map(({ cluster, omittedResultTracks }) => ({
        cluster: cluster.cluster,
        consensus: cluster.consensus,
        tracks: cluster.tracks.map(({ genes, ...track }) =>
          format === 'genes' ? { ...track, genes } : track,
        ),
        omittedResultTracks,
      })),
    };
  },
});

const findSyntenicCounterparts = defineGcvWebMcpTool({
  name: 'find_syntenic_counterparts',
  title: 'Find syntenic counterparts of a gene',
  description:
    "Finds the genes that occupy the same position as the given gene in every other aligned track of the view, i.e. its positional (syntenic) counterparts in other species, genomes and duplicated regions. Each counterpart reports whether it shares the gene's family, whether it aligns in the same or opposite direction (collinear or inverted context), and its coordinates. The gene must be in the view, as a query gene, a neighbor, or in a result track.",
  inputSchema: {
    type: 'object',
    properties: {
      gene: {
        type: 'string',
        description:
          "Gene name as the view shows it (e.g. 'glyma.Wm82.gnm4.ann1.Glyma.12G040000'); the unprefixed name ('Glyma.12G040000') also works when unambiguous.",
      },
      source: {
        type: 'string',
        description:
          'Data source of the gene, when names repeat across sources.',
      },
    },
    required: ['gene'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  execute: async ({ gene, source }, { signal }) => {
    const context = viewContext();
    await settledView(context, signal);
    const clusters = await alignments(context, signal);
    const names = new Set(
      clusters.flatMap((c) =>
        c.tracks
          .filter((t) => source === undefined || t.source === source)
          .flatMap((t) => t.genes.map((g) => g.name)),
      ),
    );
    let name = gene;
    if (!names.has(gene)) {
      const suffix = `.${gene}`.toLowerCase();
      const matches = Array.from(names).filter((n) =>
        n.toLowerCase().endsWith(suffix),
      );
      if (matches.length !== 1) {
        throw new WebMcpToolError(
          matches.length > 1
            ? `${gene} is ambiguous in this view: ${matches.join(', ')}. Pass the full name.`
            : `${gene} is not in the current view. Call show_gene_contexts with it to make it a query gene.`,
        );
      }
      name = matches[0];
    }
    const occurrences = syntenicCounterparts(clusters, name, source);
    return {
      gene: name,
      url: context.url(),
      occurrences,
      note: occurrences.some((o) => o.column === null)
        ? 'An occurrence with column null has no positional counterparts there: it was inserted between consensus columns (insertedAfter) or lies outside the alignment.'
        : undefined,
    };
  },
});

const getMacrosyntenyBlocks = defineGcvWebMcpTool({
  name: 'get_macrosynteny_blocks',
  title: 'Get macro-synteny blocks',
  description:
    "Computes the macro-synteny blocks between a query chromosome and every target chromosome in the selected data sources, using the view's block parameters, filter and order. Each block reports its orientation, its span on the query chromosome (genes and coordinates) and on the target. A per-species summary gives how many query genes the species' blocks cover and how many times over, which reveals whole-genome and segmental duplications.",
  inputSchema: {
    type: 'object',
    properties: {
      chromosome: {
        type: 'string',
        description:
          'Query chromosome name (default: every query chromosome in the view).',
      },
      targetFilter: {
        type: 'string',
        description:
          "Keep only targets whose chromosome, genus or species contains this text, case-insensitively (e.g. 'Phaseolus').",
      },
      maxTargets: {
        type: 'integer',
        minimum: 1,
        maximum: 500,
        description:
          'Most target chromosomes to report per query chromosome, in view order (default 30).',
      },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  execute: async (
    { chromosome, targetFilter, maxTargets = 30 },
    { signal },
  ) => {
    const context = viewContext();
    const { store } = context;
    const blocksService = inject(PairwiseBlocksService);
    const processService = inject(ProcessService);
    await settledView(context, signal);
    let chromosomes = await firstValueFrom(
      store.select(fromChromosome.getSelectedChromosomes),
    );
    if (chromosome !== undefined) {
      const lower = chromosome.toLowerCase();
      const matches = chromosomes.filter(
        (c) =>
          c.name.toLowerCase() === lower ||
          c.name.toLowerCase().endsWith(`.${lower}`),
      );
      if (matches.length === 0) {
        throw new WebMcpToolError(
          `${chromosome} is not a query chromosome; choose from ${chromosomes.map((c) => c.name).join(', ')}.`,
        );
      }
      chromosomes = matches;
    }
    const sources = (await firstValueFrom(store.select(fromParams.getParams)))
      .sources;
    const blockParams = await firstValueFrom(
      store.select(fromParams.getBlockParams),
    );
    const reports = [];
    for (const c of chromosomes) {
      const blocks$ = blocksService.getPairwiseBlocksForTracks(
        [c],
        sources,
        blockParams,
      );
      const process = await firstValueFrom(
        processService.getMacroBlockProcess([
          { name: c.name, source: c.source },
        ]),
      );
      const loaded = await waitFor(
        process.status,
        (s) => s.word !== 'process-running' && s.word !== 'process-waiting',
        { signal, timeoutMs: 2 * SETTLE_TIMEOUT_MS },
      );
      let blocks = await firstValueFrom(blocks$);
      if (targetFilter !== undefined && targetFilter !== '') {
        const text = targetFilter.toLowerCase();
        blocks = blocks.filter((b) =>
          `${b.chromosome} ${b.chromosomeGenus} ${b.chromosomeSpecies}`
            .toLowerCase()
            .includes(text),
        );
      }
      const shown = blocks.slice(0, maxTargets);
      const genes = await loadGenes(
        store,
        [{ names: blockEndpointGenes(c, shown), source: c.source }],
        (request) => store.dispatch(geneActions.get(request)),
        { signal, timeoutMs: SETTLE_TIMEOUT_MS },
      );
      reports.push({
        ...macroSyntenyReport(c, blocks, genes, maxTargets),
        loadStatus: loaded.timedOut
          ? 'timed out; blocks may be incomplete'
          : loaded.value.word.replace('process-', ''),
      });
    }
    return {
      url: context.url(),
      parameters: blockParams,
      chromosomes: reports,
    };
  },
});

export const geneViewWebMcpTools: GcvWebMcpTools = [
  getViewStatus,
  setViewParameters,
  getMicrosyntenyAlignment,
  findSyntenicCounterparts,
  getMacrosyntenyBlocks,
];

// Call in an injection context whose lifetime is the gene view's.
export function declareGeneViewWebMcpTools(): void {
  geneViewWebMcpTools.forEach((tool) => declareGcvWebMcpTool(tool));
}
