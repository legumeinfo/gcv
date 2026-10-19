// GCV's WebMCP tools. All of them register once the app is ready, so an agent
// sees everything GCV can do from the start: describing GCV, searching its
// data sources and opening gene views work on every page; the gene view's
// tools work on the open gene view (see gene-view.host.ts).
//
// The gene and search modules read the configuration when they load (e.g. the
// params reducer's initial state), so this file imports them only
// dynamically, after the configuration has loaded.
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
import { inGeneView } from './gene-view.host';
import {
  CONCEPTS,
  OVERVIEW,
  RECIPES,
  SEEING_THE_VIEW,
  TOOL_GUIDE,
  WORKFLOW,
} from './guide';

const NAVIGATION_TIMEOUT_MS = 30_000;
const SETTLE_TIMEOUT_MS = 60_000;
const MAX_SEARCH_GENES = 200;

// The search and gene modules provide these services, not the root injector,
// so the tools create them on first use.
const moduleServices = new WeakMap<
  EnvironmentInjector,
  Map<Type<unknown>, unknown>
>();

async function moduleService<T>(
  injector: EnvironmentInjector,
  load: () => Promise<Type<T>>,
): Promise<T> {
  const service = await load();
  if (!moduleServices.has(injector)) {
    moduleServices.set(injector, new Map());
  }
  const services = moduleServices.get(injector);
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
  description: `${OVERVIEW} ${WORKFLOW} Call describe_gcv first: it explains how to use GCV effectively, with recipes for common questions, every tool grouped by purpose, how genes and regions are named, this instance's data sources and every gene view parameter with its default.`,
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
      overview: OVERVIEW,
      workflow: WORKFLOW,
      tools: TOOL_GUIDE,
      concepts: CONCEPTS,
      recipes: RECIPES,
      seeingTheView: SEEING_THE_VIEW,
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
        "Gene view tools accept a name without its assembly prefix ('Glyma.12G040000' for 'glyma.Wm82.gnm4.ann1.Glyma.12G040000') when only one gene in the view matches; otherwise they list the candidates.",
      ],
      parameters,
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
    const searchService = await moduleService(injector, loadSearchService);
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
    "Opens the gene view on query genes, or on the genes of a genomic region, and waits for GCV to load them, cluster their neighborhoods, search every source for similar neighborhoods and align the results. Returns the view's status and its shareable URL, ready for the gene view tools. Analysis parameters already in the URL are kept.",
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
      const regionService = await moduleService(injector, loadRegionService);
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
    };
  },
});

// every tool, in the order of the guide
export async function appWebMcpTools(): Promise<GcvWebMcpTools> {
  const [analysis, inspect, display] = await Promise.all([
    import('@gcv/gene/webmcp/gene-view.tools'),
    import('@gcv/gene/webmcp/inspect.tools'),
    import('@gcv/gene/webmcp/display.tools'),
  ]);
  return [
    describeGcv,
    searchGenesAndRegions,
    showGeneContexts,
    ...[
      ...analysis.analysisWebMcpTools(),
      ...inspect.inspectWebMcpTools(),
      ...display.displayWebMcpTools(),
    ].map((tool) => inGeneView(tool)),
  ];
}

export function provideAppWebMcpTools(): EnvironmentProviders {
  return provideGcvWebMcpTools(appWebMcpTools);
}
