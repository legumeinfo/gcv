import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { AppConfig, Server } from '@gcv/core/models';
import { WebMcpToolError } from '@gcv/core/webmcp/webmcp';
import { appWebMcpTools } from './app.tools';

describe('show_gene_contexts', () => {
  let servers: Server[];

  beforeEach(() => {
    servers = AppConfig.instance.servers;
    AppConfig.instance.servers = [
      { id: 'lis', name: 'LIS', microSearch: {} },
    ] as unknown as Server[];
    TestBed.configureTestingModule({ providers: [provideStore()] });
  });

  afterEach(() => {
    AppConfig.instance.servers = servers;
  });

  async function show(args: object): Promise<unknown> {
    const tool = (await appWebMcpTools()).find(
      (t) => t.name === 'show_gene_contexts',
    );
    const signal = new AbortController().signal;
    return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      tool.execute(args, { signal }),
    );
  }

  // browsers don't enforce the schema's limits, and an empty list would open
  // an empty gene view
  it.each([
    ['no genes', []],
    ['a gene without a name', [{ name: ' ' }]],
    [
      'too many genes',
      Array.from({ length: 51 }, (_, i) => ({ name: `g${i}` })),
    ],
  ])('rejects %s', async (_, genes) => {
    await expect(show({ genes })).rejects.toThrow(
      new WebMcpToolError(
        'Give 1 to 50 genes, each with a name; search_genes_and_regions finds the names.',
      ),
    );
  });
});
