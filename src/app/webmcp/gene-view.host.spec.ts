import {
  DestroyRef,
  EnvironmentInjector,
  InjectionToken,
  createEnvironmentInjector,
  inject,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { defineGcvWebMcpTool } from '@gcv/core/webmcp/webmcp';
import { GeneViewHost, NEEDS_GENE_VIEW, inGeneView } from './gene-view.host';

const VIEW = new InjectionToken<string>('view');

describe('inGeneView', () => {
  let url: string;
  let release: () => void;

  // reports which view's injector it ran in, and holds until released
  const probe = inGeneView(
    defineGcvWebMcpTool({
      name: 'probe',
      description: 'Probes.',
      inputSchema: { type: 'object', properties: {} },
      execute: async (args, { signal }) => {
        const view = inject(VIEW);
        await new Promise<void>((resolve, reject) => {
          release = resolve;
          signal.addEventListener('abort', () => reject(signal.reason));
        });
        return view;
      },
    }),
  );

  beforeEach(() => {
    url = '/instructions';
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            get url() {
              return url;
            },
          },
        },
      ],
    });
  });

  const openView = (name: string): EnvironmentInjector => {
    const view = createEnvironmentInjector(
      [{ provide: VIEW, useValue: name }],
      TestBed.inject(EnvironmentInjector),
    );
    TestBed.inject(GeneViewHost).attach(view, view.get(DestroyRef));
    return view;
  };

  const call = () =>
    TestBed.runInInjectionContext(() =>
      probe.execute({}, { signal: new AbortController().signal } as never),
    ) as Promise<unknown>;

  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('says the tool needs a gene view', () => {
    expect(probe.description).toBe(`Probes. ${NEEDS_GENE_VIEW}`);
  });

  it('tells the agent to open a gene view when none is open', async () => {
    await expect(call()).rejects.toThrow(
      /No gene view is open.*show_gene_contexts/,
    );
  });

  it('runs in the open view', async () => {
    openView('first').destroy();
    openView('second');
    const result = call();
    await flush();
    release();
    await expect(result).resolves.toBe('second');
  });

  it('is cancelled when the view closes', async () => {
    const view = openView('closing');
    const result = call();
    await flush();
    view.destroy();
    await expect(result).rejects.toThrow(/gene view closed/);
    await expect(call()).rejects.toThrow(/No gene view is open/);
  });

  it('waits for a gene view the app is opening', async () => {
    url = '/gene;lis=g1';
    const result = call();
    await flush();
    openView('opening');
    await flush();
    release();
    await expect(result).resolves.toBe('opening');
  });
});
