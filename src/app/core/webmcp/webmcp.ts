// Thin layer over Angular's experimental WebMCP API. It adds what GCV's tools
// need on top of it: the spec's tool annotations (Angular's descriptor type
// omits them, but its runtime passes them through), execution inside NgZone
// (Angular doesn't, and router navigation outside the zone skips change
// detection), and one serialization of results for the agent.
import {
  ApplicationInitStatus,
  EnvironmentInjector,
  EnvironmentProviders,
  Injector,
  NgZone,
  WebMcpClient,
  declareExperimentalWebMcpTool,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  provideExperimentalWebMcpTools,
} from '@angular/core';
import { Observable, firstValueFrom, timer } from 'rxjs';
import { filter, map, raceWith, take } from 'rxjs/operators';

// Angular doesn't export its JSON Schema type; recover it from its signature.
export type WebMcpJsonSchema = Parameters<
  typeof provideExperimentalWebMcpTools
>[0][number]['inputSchema'];

type WebMcpArgs<S extends WebMcpJsonSchema> = Parameters<
  Parameters<typeof declareExperimentalWebMcpTool<S>>[0]['execute']
>[0];

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

export interface GcvWebMcpTool<S extends WebMcpJsonSchema> {
  name: string;
  title?: string;
  description: string;
  inputSchema: S;
  annotations?: WebMcpToolAnnotations;
  // Runs in the injection context of the injector the tool was declared with.
  // Strings are returned as-is; anything else is sent as JSON.
  execute: (args: WebMcpArgs<S>, client: WebMcpClient) => unknown;
}

// Identity function that types a tool's execute arguments from its schema.
export function defineGcvWebMcpTool<const S extends WebMcpJsonSchema>(
  tool: GcvWebMcpTool<S>,
): GcvWebMcpTool<S> {
  return tool;
}

function serialize(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result);
}

// Registers the tool until the injector (by default, the current injection
// context) is destroyed. A no-op in browsers without WebMCP.
export function declareGcvWebMcpTool<S extends WebMcpJsonSchema>(
  tool: GcvWebMcpTool<S>,
  injector: Injector = inject(Injector),
): void {
  const zone = injector.get(NgZone);
  // Settles the tool inside the zone but rejects outside it, so a tool's
  // error reaches the agent rather than Angular's ErrorHandler.
  const run = async (args, client): Promise<string> => {
    // execute must start synchronously, inside the injection context
    const outcome = await zone.run(() => {
      let result: Promise<unknown>;
      try {
        result = Promise.resolve(tool.execute(args, client));
      } catch (error) {
        result = Promise.reject(error);
      }
      return result.then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
    });
    if ('error' in outcome) {
      throw outcome.error;
    }
    return serialize(outcome.value);
  };
  const wrapped: GcvWebMcpTool<S> = {
    ...tool,
    execute: (args, client) => {
      const result = run(args, client);
      // The caller handles the rejection, but a native await attaches its
      // handler a microtask late; without this zone.js reports it first.
      result.catch(() => undefined);
      return result;
    },
  };
  declareExperimentalWebMcpTool<S>(wrapped, injector).catch((error) =>
    console.warn(`WebMCP: could not register ${tool.name}`, error),
  );
}

// A list of tools with different input schemas; each tool's execute is typed
// where it is defined.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GcvWebMcpTools = ReadonlyArray<GcvWebMcpTool<any>>;

// Registers the tools once the app has initialized, which includes loading
// its configuration, for the lifetime of the environment injector. Tools are
// built then, so their schemas can list what the configuration provides and
// they can load modules that read it.
export function provideGcvWebMcpTools(
  tools: () => GcvWebMcpTools | Promise<GcvWebMcpTools>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const injector = inject(EnvironmentInjector);
      inject(ApplicationInitStatus)
        .donePromise.then(tools)
        .then((built) => {
          if (!injector.destroyed) {
            built.forEach((tool) => declareGcvWebMcpTool(tool, injector));
          }
        })
        .catch((error) => console.warn('WebMCP: could not build tools', error));
    }),
  ]);
}

// An error whose message tells the agent how to recover.
export class WebMcpToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebMcpToolError';
  }
}

// value is set unless timedOut
export type WaitResult<T> = { value?: T; timedOut: boolean };

// Resolves with the first value of source$ that satisfies predicate, or with
// timedOut once timeoutMs passes; rejects if the agent aborts the call.
export function waitFor<T>(
  source$: Observable<T>,
  predicate: (value: T) => boolean,
  { signal, timeoutMs }: { signal?: AbortSignal; timeoutMs: number },
): Promise<WaitResult<T>> {
  const value$ = source$.pipe(
    filter(predicate),
    map((value): WaitResult<T> => ({ value, timedOut: false })),
  );
  const timeout$ = timer(timeoutMs).pipe(
    map((): WaitResult<T> => ({ timedOut: true })),
  );
  const result = firstValueFrom(value$.pipe(raceWith(timeout$), take(1)));
  if (signal === undefined) {
    return result;
  }
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    result
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}
