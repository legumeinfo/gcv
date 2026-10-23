import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { AppConfig, Server } from '@gcv/core/models';
import {
  ANNOTATION_KEYWORDS,
  CHECKED_KEYWORDS,
} from '@gcv/core/webmcp/arguments';
import { declareGcvWebMcpTool } from '@gcv/core/webmcp/webmcp';
import { appWebMcpTools } from './app.tools';
import {
  CONCEPTS,
  OVERVIEW,
  RECIPES,
  REPORTING,
  SEEING_THE_VIEW,
  TOOL_GUIDE,
  WORKFLOW,
} from './guide';

// jsdom has no WebMCP, so stand in for the browser's registry
const page = document as unknown as { modelContext?: object };

// every keyword a schema uses, with where it is
function keywords(schema: object, path: string): string[] {
  return Object.entries(schema).flatMap(([key, value]) => {
    const here = [`${path}: ${key}`];
    if (key === 'properties') {
      return [
        ...here,
        ...Object.entries(value).flatMap(([name, property]) =>
          keywords(property, `${path}.${name}`),
        ),
      ];
    }
    if ((key === 'items' || key === 'additionalProperties') && value) {
      return typeof value === 'object'
        ? [...here, ...keywords(value, `${path}[${key}]`)]
        : here;
    }
    return here;
  });
}

describe('the app WebMCP tools', () => {
  let servers: Server[];
  let registered: Map<
    string,
    { execute: (args: unknown, client: object) => Promise<string> }
  >;

  beforeEach(() => {
    servers = AppConfig.instance.servers;
    AppConfig.instance.servers = [
      { id: 'lis', name: 'LIS', microSearch: {} },
    ] as unknown as Server[];
    TestBed.configureTestingModule({ providers: [provideStore()] });
    registered = new Map();
    page.modelContext = {
      registerTool: async (tool) => registered.set(tool.name, tool),
    };
  });

  afterEach(() => {
    AppConfig.instance.servers = servers;
    delete page.modelContext;
  });

  // the argument check ignores keywords it doesn't implement
  it('use only the schema keywords the argument check implements', async () => {
    const known = new Set([...CHECKED_KEYWORDS, ...ANNOTATION_KEYWORDS]);
    const unknown = (await appWebMcpTools()).flatMap((tool) =>
      keywords(tool.inputSchema, tool.name).filter(
        (k) => !known.has(k.split(': ')[1]),
      ),
    );
    expect(unknown).toEqual([]);
  });

  async function call(name: string, args: unknown): Promise<unknown> {
    const injector = TestBed.inject(EnvironmentInjector);
    (await appWebMcpTools()).forEach((t) => declareGcvWebMcpTool(t, injector));
    await new Promise((resolve) => setTimeout(resolve));
    const signal = new AbortController().signal;
    return JSON.parse(await registered.get(name).execute(args, { signal }));
  }

  it('describe_gcv returns every section of the guide', async () => {
    const guide = (await call('describe_gcv', {})) as Record<string, unknown>;
    expect(guide).toMatchObject({
      overview: OVERVIEW,
      workflow: WORKFLOW,
      tools: TOOL_GUIDE,
      concepts: CONCEPTS,
      recipes: RECIPES,
      reporting: REPORTING,
      seeingTheView: SEEING_THE_VIEW,
    });
  });

  // an empty list would open an empty gene view
  it.each([
    ['no genes', [], 'genes: must have at least 1 item'],
    [
      'too many genes',
      Array.from({ length: 51 }, (_, i) => ({ name: `g${i}` })),
      'genes: must have at most 50 items',
    ],
    ['a gene without a name', [{}], 'genes[0].name: is required'],
    [
      'a blank name',
      [{ name: ' ' }],
      'Give every gene a name; search_genes_and_regions finds the names.',
    ],
  ])('show_gene_contexts rejects %s', async (_, genes, error) => {
    const result = await call('show_gene_contexts', { genes });
    expect(result).toEqual({ error: expect.stringContaining(error) });
  });
});
