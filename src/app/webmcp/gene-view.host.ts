// The gene view's tools are registered for the whole app, so agents see every
// tool from the start, but they work on the open gene view. The view attaches
// itself here; a tool runs in the injection context of the attached view and
// is cancelled if the view closes while it runs.
import {
  DestroyRef,
  Injectable,
  Injector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
// app
import {
  GcvWebMcpTool,
  WebMcpJsonSchema,
  WebMcpToolError,
  waitFor,
} from '@gcv/core/webmcp/webmcp';

const OPEN_TIMEOUT_MS = 30_000;

export const NEEDS_GENE_VIEW =
  'Works on the open gene view; show_gene_contexts opens one.';

const NO_GENE_VIEW =
  'No gene view is open. Open one with show_gene_contexts (after search_genes_and_regions to find gene names), then call this tool again.';

type OpenGeneView = { injector: Injector; closed: AbortSignal };

@Injectable({ providedIn: 'root' })
export class GeneViewHost {
  private _view = new BehaviorSubject<OpenGeneView | undefined>(undefined);

  readonly view$ = this._view.asObservable();

  get view(): OpenGeneView | undefined {
    return this._view.value;
  }

  // holds the view until its injector is destroyed
  attach(injector: Injector, destroyRef: DestroyRef): void {
    const controller = new AbortController();
    const view = { injector, closed: controller.signal };
    this._view.next(view);
    destroyRef.onDestroy(() => {
      controller.abort(
        new WebMcpToolError(
          'The gene view closed while the tool was running; open it again with show_gene_contexts.',
        ),
      );
      if (this._view.value === view) {
        this._view.next(undefined);
      }
    });
  }
}

// Call in the gene view's injection context.
export function attachGeneViewToWebMcp(): void {
  inject(GeneViewHost).attach(inject(Injector), inject(DestroyRef));
}

// The tool, run in the open gene view. While the app is opening a gene view
// (e.g. right after a page load), it waits for the view.
export function inGeneView<S extends WebMcpJsonSchema>(
  tool: GcvWebMcpTool<S>,
): GcvWebMcpTool<S> {
  return {
    ...tool,
    description: `${tool.description} ${NEEDS_GENE_VIEW}`,
    execute: async (args, client) => {
      const host = inject(GeneViewHost);
      const router = inject(Router);
      let view = host.view;
      if (view === undefined && router.url.startsWith('/gene')) {
        view = (
          await waitFor(host.view$, (v) => v !== undefined, {
            signal: client.signal,
            timeoutMs: OPEN_TIMEOUT_MS,
          })
        ).value;
      }
      if (view === undefined) {
        throw new WebMcpToolError(NO_GENE_VIEW);
      }
      const signal = AbortSignal.any([client.signal, view.closed]);
      return runInInjectionContext(view.injector, () =>
        tool.execute(args, { ...client, signal }),
      );
    },
  };
}
