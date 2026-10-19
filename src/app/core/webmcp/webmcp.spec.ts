import {
  EnvironmentInjector,
  InjectionToken,
  NgZone,
  createEnvironmentInjector,
  inject,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  declareGcvWebMcpTool,
  defineGcvWebMcpTool,
  provideGcvWebMcpTools,
  waitFor,
} from './webmcp';

// jsdom has no WebMCP, so stand in for the browser's registry
type Registration = {
  tool: {
    name: string;
    annotations?: object;
    execute: (args: object, client: { signal: AbortSignal }) => unknown;
  };
  signal: AbortSignal;
};

describe('GCV WebMCP tools', () => {
  let registrations: Registration[];

  beforeEach(() => {
    registrations = [];
    (document as any).modelContext = {
      registerTool: async (tool, { signal }) => {
        registrations.push({ tool, signal });
      },
    };
  });

  afterEach(() => {
    delete (document as any).modelContext;
  });

  const echo = defineGcvWebMcpTool({
    name: 'echo',
    description: 'Echoes its input.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
    },
    annotations: { readOnlyHint: true },
    execute: ({ text }) =>
      text === undefined ? { inZone: NgZone.isInAngularZone() } : text,
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve));

  function declareIn(): EnvironmentInjector {
    const injector = createEnvironmentInjector(
      [],
      TestBed.inject(EnvironmentInjector),
    );
    declareGcvWebMcpTool(echo, injector);
    return injector;
  }

  it('registers the tool with its annotations', async () => {
    declareIn();
    await flush();
    expect(registrations).toHaveLength(1);
    expect(registrations[0].tool).toMatchObject({
      name: 'echo',
      annotations: { readOnlyHint: true },
    });
  });

  it('runs in the Angular zone and serializes non-string results', async () => {
    declareIn();
    await flush();
    const { execute } = registrations[0].tool;
    const signal = new AbortController().signal;
    await expect(execute({}, { signal })).resolves.toBe('{"inZone":true}');
    await expect(execute({ text: 'hi' }, { signal })).resolves.toBe('hi');
  });

  it('runs execute in the injection context of its injector', async () => {
    const GREETING = new InjectionToken<string>('greeting');
    const greet = defineGcvWebMcpTool({
      name: 'greet',
      description: 'Greets.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => inject(GREETING),
    });
    const injector = createEnvironmentInjector(
      [{ provide: GREETING, useValue: 'hello' }],
      TestBed.inject(EnvironmentInjector),
    );
    declareGcvWebMcpTool(greet, injector);
    await flush();
    const signal = new AbortController().signal;
    await expect(registrations[0].tool.execute({}, { signal })).resolves.toBe(
      'hello',
    );
  });

  it("rejects with the tool's error", async () => {
    const fail = defineGcvWebMcpTool({
      name: 'fail',
      description: 'Fails.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => {
        throw new Error('bad input');
      },
    });
    declareGcvWebMcpTool(
      fail,
      createEnvironmentInjector([], TestBed.inject(EnvironmentInjector)),
    );
    await flush();
    const signal = new AbortController().signal;
    await expect(registrations[0].tool.execute({}, { signal })).rejects.toThrow(
      'bad input',
    );
  });

  it('unregisters when its injector is destroyed', async () => {
    const injector = declareIn();
    await flush();
    expect(registrations[0].signal.aborted).toBe(false);
    injector.destroy();
    expect(registrations[0].signal.aborted).toBe(true);
  });

  it('registers provided tools when the environment initializes', async () => {
    createEnvironmentInjector(
      [provideGcvWebMcpTools([echo])],
      TestBed.inject(EnvironmentInjector),
    );
    await flush();
    expect(registrations.map((r) => r.tool.name)).toEqual(['echo']);
  });
});

describe('waitFor', () => {
  it('resolves with the first value that satisfies the predicate', async () => {
    const values = new Subject<number>();
    const result = waitFor(values, (v) => v > 1, { timeoutMs: 1000 });
    [1, 2, 3].forEach((v) => values.next(v));
    await expect(result).resolves.toEqual({ value: 2, timedOut: false });
  });

  it('reports a timeout', async () => {
    const result = waitFor(new Subject<number>(), () => true, {
      timeoutMs: 1,
    });
    await expect(result).resolves.toEqual({ timedOut: true });
  });

  it('rejects when the call is aborted', async () => {
    const controller = new AbortController();
    const result = waitFor(new Subject<number>(), () => true, {
      timeoutMs: 1000,
      signal: controller.signal,
    });
    controller.abort(new Error('cancelled'));
    await expect(result).rejects.toThrow('cancelled');
  });
});
