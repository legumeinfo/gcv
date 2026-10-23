// WebMCP tools that read and change the analysis of the gene view. They run
// in the open gene view's injection context (see webmcp/gene-view.host.ts).
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// store
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import {
  GcvWebMcpTools,
  WebMcpJsonSchema,
  WebMcpToolError,
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
  syntenicCounterparts,
} from './alignment.report';
import { blockEndpointGenes, macroSyntenyReport } from './blocks.report';
import { regionPresence, trackChanges } from './changes.report';
import {
  SETTLE_TIMEOUT_MS,
  ViewContext,
  alignments,
  settledView,
  viewContext,
  viewGenes,
} from './gene-view.context';
import { matchGeneName } from './lookup';
import { parameterSchemas, validateParameterUpdate } from './parameters';
import { currentGeneView, waitForSettledGeneView } from './view-state';

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

// most added and removed tracks set_view_parameters reports
const MAX_CHANGED_TRACKS = 25;
const MAX_PARAMETER_SETS = 4;

type ParameterChanges = Record<string, { from: unknown; to: unknown }>;

// the update's parameters, checked with the URL guard's validators
function validParameters(
  update: Record<string, unknown>,
  context: string,
): Record<string, unknown> {
  const { params, errors } = validateParameterUpdate(update);
  if (errors.length > 0) {
    throw new WebMcpToolError(`${context} Invalid: ${errors.join('; ')}`);
  }
  return params;
}

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

function parameterChanges(
  current: Params,
  params: Record<string, unknown>,
): ParameterChanges {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key, value]) => !sameValue(current[key], value))
      .map(([key, value]) => [key, { from: current[key], to: value }]),
  );
}

// Applies the parameters through the URL and waits for the view to settle on
// them.
async function applyParameters(
  { store }: ViewContext,
  paramsService: ParamsService,
  params: Record<string, unknown>,
  signal: AbortSignal,
) {
  paramsService.updateParams(params as Params);
  const applied = await waitFor(
    store.select(fromParams.getParams),
    (p) =>
      Object.entries(params).every(([key, value]) => sameValue(p[key], value)),
    { signal, timeoutMs: SETTLE_TIMEOUT_MS },
  );
  if (applied.timedOut) {
    throw new WebMcpToolError(
      'The parameters were not applied; the URL may have been rejected. Call get_view_status to see the current parameters.',
    );
  }
  return waitForSettledGeneView(store, {
    signal,
    timeoutMs: SETTLE_TIMEOUT_MS,
  });
}

const resultTrackCount = (clusters: ClusterAlignment[]) =>
  clusters.flatMap((c) => c.tracks).filter((t) => t.role === 'result').length;

const parameterProperties = () =>
  parameterSchemas() as unknown as Record<string, WebMcpJsonSchema>;

// built when tools register, once the configuration has loaded
const setViewParameters = () =>
  defineGcvWebMcpTool({
    name: 'set_view_parameters',
    title: 'Set gene view parameters',
    description:
      'Changes analysis and display parameters of the gene view: the query neighborhood size, micro-synteny search sensitivity, clustering, alignment scoring, result filters and order, macro-synteny block criteria, and data sources. Parameters left out keep their values. The change is recorded in the URL, so the returned URL reproduces the view. Waits for the view to reload and returns the parameters that changed, the result tracks the change added and removed (a track that keeps any of its genes counts as kept), and the new view status.',
    inputSchema: {
      type: 'object',
      properties: parameterProperties(),
      additionalProperties: false,
    },
    execute: async (args, { signal }) => {
      const context = viewContext();
      const { store, url } = context;
      const paramsService = inject(ParamsService);
      const params = validParameters(
        args as Record<string, unknown>,
        'No parameters changed.',
      );
      const current: Params = await firstValueFrom(
        store.select(fromParams.getParams),
      );
      const changed = parameterChanges(current, params);
      if (Object.keys(changed).length === 0) {
        const view = await waitForSettledGeneView(store, {
          signal,
          timeoutMs: SETTLE_TIMEOUT_MS,
        });
        return { changed, url: url(), view };
      }
      const settledBefore = await waitForSettledGeneView(store, {
        signal,
        timeoutMs: SETTLE_TIMEOUT_MS,
      });
      const before = await alignments(context, signal);
      const view = await applyParameters(
        context,
        paramsService,
        params,
        signal,
      );
      const tracks = trackChanges(
        before,
        await alignments(context, signal),
        MAX_CHANGED_TRACKS,
      );
      // a view that hadn't finished loading compares incomplete track lists
      const incomplete = settledBefore.timedOut || view.timedOut;
      return {
        changed,
        url: url(),
        tracks: incomplete
          ? {
              ...tracks,
              note: 'The view had not finished loading before or after the change, so some tracks may be missing from this comparison.',
            }
          : tracks,
        view,
      };
    },
  });

// built when tools register, once the configuration has loaded
const compareParameterSets = () =>
  defineGcvWebMcpTool({
    name: 'compare_parameter_sets',
    title: 'Compare parameter sets',
    description:
      "Tests which result regions hold up across parameters. Runs the view's analysis again with each set of parameter changes in turn, each applied to the current parameters, then restores the current parameters. Reports every region (a stretch of one chromosome, followed across runs through the genes its tracks share) with the runs that found it ('current', 'set1', 'set2', …) and its support in each: alignment score, distinct and single-copy families matched, the genes the matches span and the largest gap between them. A region found only with loosened matched or score is weak evidence; one that a wider window (neighbors, intermediate) finds at strict thresholds is robust. Each run's URL reproduces it. Takes as long as reloading the view once per set.",
    inputSchema: {
      type: 'object',
      properties: {
        sets: {
          type: 'array',
          minItems: 1,
          maxItems: MAX_PARAMETER_SETS,
          items: {
            type: 'object',
            properties: parameterProperties(),
            additionalProperties: false,
          },
          description:
            'Parameter changes to try, each against the current parameters, e.g. [{"neighbors": 20, "intermediate": 15}, {"matched": 6, "score": 40}].',
        },
        maxRegions: {
          type: 'integer',
          minimum: 1,
          maximum: 200,
          description:
            'Most regions to report, those found by the most runs first (default 50).',
        },
      },
      required: ['sets'],
      additionalProperties: false,
    },
    execute: async ({ sets, maxRegions = 50 }, { signal }) => {
      const context = viewContext();
      const { store, url } = context;
      const paramsService = inject(ParamsService);
      const updates = sets.map((set, i) =>
        validParameters(
          set as Record<string, unknown>,
          `Nothing was run. set${i + 1}:`,
        ),
      );
      await settledView(context, signal);
      const current: Params = await firstValueFrom(
        store.select(fromParams.getParams),
      );
      // every run starts from the current values of the parameters any set
      // changes, which the end restores
      const touched = new Set(updates.flatMap((u) => Object.keys(u)));
      const base = Object.fromEntries(
        [...touched].map((key) => [key, current[key]]),
      );
      const views = [
        {
          label: 'current',
          url: url(),
          clusters: await alignments(context, signal),
        },
      ];
      const runs = [];
      try {
        for (const [i, update] of updates.entries()) {
          const label = `set${i + 1}`;
          const view = await applyParameters(
            context,
            paramsService,
            { ...base, ...update },
            signal,
          );
          const clusters = await alignments(context, signal);
          views.push({ label, url: url(), clusters });
          runs.push({
            label,
            changed: parameterChanges(current, update),
            url: url(),
            resultTracks: resultTrackCount(clusters),
            ...(view.timedOut ? { timedOut: true } : {}),
          });
        }
      } catch (error) {
        // leave the user's view as it was, even when the agent cancels
        paramsService.updateParams(base as Params);
        throw error;
      }
      const restored = await applyParameters(
        context,
        paramsService,
        base,
        signal,
      );
      return {
        current: {
          url: views[0].url,
          resultTracks: resultTrackCount(views[0].clusters),
        },
        runs,
        ...regionPresence(views, maxRegions),
        restored: { url: url(), status: restored.status },
      };
    },
  });

const getMicrosyntenyAlignment = defineGcvWebMcpTool({
  name: 'get_microsynteny_alignment',
  title: 'Get micro-synteny alignment',
  description:
    "Reads the micro-synteny alignment the view computed. Each cluster of query tracks has a consensus sequence of gene families; every query and result track is aligned to it, so genes in the same consensus column correspond positionally across species and genomes. 'summary' reports, per track, its species, chromosome, span, alignment score, and how many genes aligned, matched the consensus family, aligned inverted, or fell in separate segments, with the matches' support: how many distinct families matched, how many of those have one copy in both the consensus and the track (the strongest evidence; tandem and large families are shared by chance), how many genes the matches span, and the largest run of unmatched genes between them. 'genes' adds every gene with its family, column (or, for a gene inserted between columns, the column it follows), alignment orientation, strand and coordinates. 'tsv' gives one row per track and one column per consensus position; a cell holds the aligned gene, then genes inserted after it marked '+', with ' (-)' marking inverted alignment. Results follow the view's current filter and order.",
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
    const matches = matchGeneName(names, gene);
    if (matches.length !== 1) {
      throw new WebMcpToolError(
        matches.length > 1
          ? `${gene} is ambiguous in this view: ${matches.join(', ')}. Pass the full name.`
          : `${gene} is not in the current view. Call show_gene_contexts with it to make it a query gene.`,
      );
    }
    const name = matches[0];
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
      const genes = await viewGenes(
        context,
        [{ names: blockEndpointGenes(c, shown), source: c.source }],
        signal,
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

// the analysis tools, in the order agents use them
export const analysisWebMcpTools = (): GcvWebMcpTools => [
  getViewStatus,
  setViewParameters(),
  compareParameterSets(),
  getMicrosyntenyAlignment,
  findSyntenicCounterparts,
  getMacrosyntenyBlocks,
];
