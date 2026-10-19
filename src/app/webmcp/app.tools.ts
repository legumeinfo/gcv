// WebMCP tools available on every page: describing GCV, searching its data
// sources, and opening gene views. The gene view adds tools of its own while
// it is open (see gene/webmcp/gene-view.tools.ts).
import {
  DOCUMENT,
  EnvironmentInjector,
  EnvironmentProviders,
  Type,
  createEnvironmentInjector,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
// store
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromRouter from '@gcv/store/selectors/router';
// app
import { AppConfig, Server } from '@gcv/core/models';
import {
  GcvWebMcpTools,
  WebMcpToolError,
  defineGcvWebMcpTool,
  provideGcvWebMcpTools,
  waitFor,
} from '@gcv/core/webmcp/webmcp';

const NAVIGATION_TIMEOUT_MS = 30_000;
const SETTLE_TIMEOUT_MS = 60_000;
const MAX_SEARCH_GENES = 200;

const GENE_VIEW_TOOLS = [
  'get_view_status',
  'set_view_parameters',
  'get_microsynteny_alignment',
  'find_syntenic_counterparts',
  'get_macrosynteny_blocks',
];

// The search and gene modules provide these services lazily, so the tools
// load them on first use rather than adding them to the initial bundle.
const lazyServices = new WeakMap<
  EnvironmentInjector,
  Map<Type<unknown>, unknown>
>();

async function lazyService<T>(
  injector: EnvironmentInjector,
  load: () => Promise<Type<T>>,
): Promise<T> {
  const service = await load();
  if (!lazyServices.has(injector)) {
    lazyServices.set(injector, new Map());
  }
  const services = lazyServices.get(injector);
  if (!services.has(service)) {
    const child = createEnvironmentInjector([service], injector);
    services.set(service, child.get(service));
  }
  return services.get(service) as T;
}

const loadSearchService = () =>
  import('@gcv/search/services/search.service').then((m) => m.SearchService);

const loadRegionService = () =>
  import('@gcv/gene/services/region.service').then((m) => m.RegionService);

const serverIDs = (has: keyof Server): string[] =>
  AppConfig.servers.filter((s) => s[has] !== undefined).map((s) => s.id);

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const describeGcv = defineGcvWebMcpTool({
  name: 'describe_gcv',
  title: 'Describe GCV',
  description:
    "Describes this Genome Context Viewer (GCV): what it computes, its data sources and what each supports, how genes, chromosomes and regions are named, every gene view parameter with its meaning and default, and which tools to use for what. Call it first to learn the instance's vocabulary.",
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  execute: async () => {
    const document = inject(DOCUMENT);
    const { parameterSchemas, parameterDefaults } =
      await import('@gcv/gene/webmcp/parameters');
    const defaults = parameterDefaults();
    const parameters = Object.fromEntries(
      Object.entries(parameterSchemas()).map(([name, schema]) => [
        name,
        { ...schema, default: defaults[name] },
      ]),
    );
    return {
      app: AppConfig.brand?.name ?? 'Genome Context Viewer',
      url: document.location.href,
      purpose:
        'GCV compares the genomic context of genes across genomes, using gene families as the unit of homology. For query genes it takes a neighborhood of genes around each, clusters similar neighborhoods, aligns them into a consensus, searches the data sources for similar neighborhoods (micro-synteny) and aligns those to the consensus. It also computes chromosome-scale synteny blocks between query chromosomes and whole genomes (macro-synteny).',
      sources: AppConfig.servers.map((s) => {
        const { description, website } = s as Server & {
          description?: string;
          website?: string;
        };
        return {
          id: s.id,
          name: s.name,
          description,
          website,
          supports: {
            search: s.search !== undefined,
            geneContexts: s.microSearch !== undefined,
            macroSynteny: s.blocks !== undefined,
            regions: s.region !== undefined,
            geneLinks: s.geneLinks !== undefined,
          },
        };
      }),
      searchExamples: stripHtml(AppConfig.miscellaneous?.searchHelpText ?? ''),
      identifiers: [
        'Genes, chromosomes and families are identified by the names the data source uses; take them from search_genes_and_regions or the view rather than constructing them.',
        "A region is written 'chromosome:start-stop' in base pairs, e.g. 'glyma.Wm82.gnm4.Gm12:1000000-1200000'.",
        'Coordinates belong to one genome assembly; compare them only within a chromosome.',
        'A gene family is the unit of homology: genes in the same family are treated as matching when aligning and searching.',
      ],
      workflow: [
        'search_genes_and_regions to turn names, symbols or regions into gene names.',
        'show_gene_contexts to open the gene view on chosen genes or a region; it waits for the analysis and returns its status.',
        'get_microsynteny_alignment and find_syntenic_counterparts to read gene-level correspondence across genomes.',
        'get_macrosynteny_blocks for chromosome-scale synteny and duplication depth.',
        'set_view_parameters to change the analysis; every view is reproducible from its URL.',
      ],
      parameters,
      tools: {
        everyPage: [
          'describe_gcv',
          'search_genes_and_regions',
          'show_gene_contexts',
        ],
        whileGeneViewIsOpen: GENE_VIEW_TOOLS,
      },
    };
  },
});

const searchGenesAndRegions = defineGcvWebMcpTool({
  name: 'search_genes_and_regions',
  title: 'Search genes and regions',
  description:
    "Searches the data sources for genes and genomic regions matching free text: gene names or partial names, several at once, or regions written 'chromosome:start-stop'. Returns, per source, matching gene names and, for regions, the gene at the region's center with the number of neighbors that spans it. Doesn't change the view.",
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        description:
          "Text to search for, e.g. 'Glyma.15G255600' or 'Vu01:1-1000000'.",
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Sources to search (default: every source with search).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  execute: async ({ query, sources }) => {
    const injector = inject(EnvironmentInjector);
    const searchable = serverIDs('search');
    const targets = sources ?? searchable;
    const unknown = targets.filter((s) => !searchable.includes(s));
    if (unknown.length > 0) {
      throw new WebMcpToolError(
        `Unknown or unsearchable sources ${unknown.join(', ')}; choose from ${searchable.join(', ')}.`,
      );
    }
    const searchService = await lazyService(injector, loadSearchService);
    const results = await Promise.all(
      targets.map(async (source) => {
        const name = AppConfig.getServer(source)?.name;
        try {
          const { genes = [], regions = [] } = await firstValueFrom(
            searchService.search(query, source),
          );
          return {
            source,
            name,
            genes: genes.slice(0, MAX_SEARCH_GENES),
            omittedGenes: Math.max(0, genes.length - MAX_SEARCH_GENES),
            regions,
          };
        } catch (error) {
          return { source, name, error: String(error?.message ?? error) };
        }
      }),
    );
    return { query, results };
  },
});

const REGION_PATTERN = /^\s*(\S+):([\d,]+)\s*(?:-|\.\.)\s*([\d,]+)\s*$/;

const showGeneContexts = defineGcvWebMcpTool({
  name: 'show_gene_contexts',
  title: 'Show gene contexts',
  description:
    "Opens the gene view on query genes, or on the genes of a genomic region, and waits for GCV to load them, cluster their neighborhoods, search every source for similar neighborhoods and align the results. Returns the view's status and its shareable URL; the gene view's own tools are then available. Analysis parameters already in the URL are kept.",
  inputSchema: {
    type: 'object',
    properties: {
      genes: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description:
                'Full gene name as search_genes_and_regions returns it.',
            },
            source: {
              type: 'string',
              description: "The gene's data source (default: source).",
            },
          },
          required: ['name'],
          additionalProperties: false,
        },
        description: 'Query genes. Give genes or region, not both.',
      },
      region: {
        type: 'string',
        description:
          "A region 'chromosome:start-stop'; its central gene becomes the query, with enough neighbors to span it.",
      },
      source: {
        type: 'string',
        description:
          'Data source for the region and for genes without their own (default: the only source, when there is one).',
      },
      neighbors: {
        type: 'integer',
        minimum: 1,
        description:
          'Genes on each side of each query gene (default: the current value, or what spans the region).',
      },
    },
    additionalProperties: false,
  },
  execute: async ({ genes, region, source, neighbors }, { signal }) => {
    const store = inject<Store<fromRoot.State>>(Store);
    const injector = inject(EnvironmentInjector);
    const document = inject(DOCUMENT);
    if ((genes === undefined) === (region === undefined)) {
      throw new WebMcpToolError('Give either genes or region.');
    }
    const ids = serverIDs('microSearch');
    const defaultSource = source ?? (ids.length === 1 ? ids[0] : undefined);
    const checkSource = (s: string | undefined, what: string): string => {
      if (s === undefined) {
        throw new WebMcpToolError(
          `Name the source of ${what}; choose from ${ids.join(', ')}.`,
        );
      }
      if (!ids.includes(s)) {
        throw new WebMcpToolError(
          `Unknown source ${s}; choose from ${ids.join(', ')}.`,
        );
      }
      return s;
    };
    const matrix: Record<string, string[]> = {};
    const query: Record<string, number> = {};
    let resolvedRegion;
    if (region !== undefined) {
      const match = REGION_PATTERN.exec(region);
      if (match === null) {
        throw new WebMcpToolError(
          `Write the region as 'chromosome:start-stop', not '${region}'.`,
        );
      }
      const [chromosome, start, stop] = [
        match[1],
        Number(match[2].replace(/,/g, '')),
        Number(match[3].replace(/,/g, '')),
      ];
      const regionSource = checkSource(defaultSource, 'the region');
      if (!serverIDs('region').includes(regionSource)) {
        throw new WebMcpToolError(`${regionSource} doesn't support regions.`);
      }
      const regionService = await lazyService(injector, loadRegionService);
      let found;
      try {
        found = await firstValueFrom(
          regionService.getRegion(chromosome, start, stop, regionSource),
        );
      } catch (error) {
        throw new WebMcpToolError(
          `Could not look up ${region} in ${regionSource}: ${error?.message ?? error}. Check the chromosome name with search_genes_and_regions.`,
        );
      }
      if (!found?.gene) {
        throw new WebMcpToolError(`${region} contains no genes.`);
      }
      matrix[regionSource] = [found.gene];
      query.neighbors = neighbors ?? found.neighbors;
      resolvedRegion = {
        region,
        source: regionSource,
        centerGene: found.gene,
        neighbors: found.neighbors,
      };
    } else {
      genes.forEach((g) => {
        const s = checkSource(g.source ?? defaultSource, g.name);
        matrix[s] = [...(matrix[s] ?? []), g.name];
      });
      if (neighbors !== undefined) {
        query.neighbors = neighbors;
      }
    }
    const matrixParams = Object.fromEntries(
      Object.entries(matrix).map(([s, names]) => [s, names.join(',')]),
    );
    store.dispatch(routerActions.go({ path: ['/gene', matrixParams], query }));
    const routed = await waitFor(
      store.select(fromRouter.selectRouterState),
      ({ url, params }) =>
        url.startsWith('/gene') &&
        Object.entries(matrixParams).every(([s, names]) => params[s] === names),
      { signal, timeoutMs: NAVIGATION_TIMEOUT_MS },
    );
    if (routed.timedOut) {
      throw new WebMcpToolError(
        'The gene view did not open; the genes or parameters may be invalid.',
      );
    }
    const { waitForSettledGeneView } =
      await import('@gcv/gene/webmcp/view-state');
    const view = await waitForSettledGeneView(store, {
      signal,
      timeoutMs: SETTLE_TIMEOUT_MS,
    });
    return {
      url: document.location.href,
      region: resolvedRegion,
      view,
      tools: GENE_VIEW_TOOLS,
    };
  },
});

export const appWebMcpTools: GcvWebMcpTools = [
  describeGcv,
  searchGenesAndRegions,
  showGeneContexts,
];

export function provideAppWebMcpTools(): EnvironmentProviders {
  return provideGcvWebMcpTools(appWebMcpTools);
}
