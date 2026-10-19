// What the gene view's tools share: the dependencies they capture before
// their first await, and reads of the settled view.
import { DOCUMENT, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
// store
import * as fromRoot from '@gcv/store/reducers';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
// app
import { WebMcpToolError } from '@gcv/core/webmcp/webmcp';
import { Gene } from '@gcv/gene/models';
import { ClusterAlignment, clusterAlignments } from './alignment.report';
import {
  AlignedTrack,
  GeneViewSummary,
  loadGenes,
  waitForSettledGeneView,
} from './view-state';

export const SETTLE_TIMEOUT_MS = 60_000;

// inject() only works before a tool's first await, so tools take everything
// they need up front
export type ViewContext = {
  store: Store<fromRoot.State>;
  document: Document;
  url: () => string;
};

export function viewContext(): ViewContext {
  const document = inject(DOCUMENT);
  return {
    store: inject<Store<fromRoot.State>>(Store),
    document,
    url: () => document.location.href,
  };
}

// waits for the view to settle and fails when it has nothing to report on
export async function settledView(
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

// the query tracks and every aligned track of the view, in the viewer's order
export async function viewTracks({ store }: ViewContext): Promise<{
  consensuses: string[][];
  queryTracks: AlignedTrack[];
  tracks: AlignedTrack[];
}> {
  const query = await firstValueFrom(
    store.select(fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
  );
  const tracks = await firstValueFrom(
    store.select(fromMicroTracks.getAllClusteredAndAlignedMicroTracks),
  );
  return {
    consensuses: query.consensuses,
    queryTracks: query.tracks,
    tracks,
  };
}

// fails unless the view has the cluster
export function checkCluster(tracks: AlignedTrack[], cluster: number): void {
  if (!tracks.some((t) => t.cluster === cluster)) {
    const ids = Array.from(new Set(tracks.map((t) => t.cluster)));
    throw new WebMcpToolError(
      `No cluster ${cluster}; the view has clusters ${ids.join(', ')}.`,
    );
  }
}

// Requests the genes and waits until each has loaded or failed; returns the
// loaded genes keyed by geneID(name, source).
export function viewGenes(
  { store }: ViewContext,
  requests: { names: string[]; source: string }[],
  signal: AbortSignal,
): Promise<Map<string, Gene>> {
  return loadGenes(
    store,
    requests,
    (request) => store.dispatch(geneActions.get(request)),
    { signal, timeoutMs: SETTLE_TIMEOUT_MS },
  );
}

function geneRequests(tracks: AlignedTrack[]) {
  return geneActions.tracksToGetGeneActions(tracks).map((a) => a.payload);
}

// the aligned tracks of the view, in the viewer's order, with gene positions
export async function alignments(
  context: ViewContext,
  signal: AbortSignal,
  cluster?: number,
): Promise<ClusterAlignment[]> {
  const { consensuses, queryTracks, tracks: all } = await viewTracks(context);
  let tracks = all;
  if (cluster !== undefined) {
    checkCluster(tracks, cluster);
    tracks = tracks.filter((t) => t.cluster === cluster);
  }
  const genes = await viewGenes(context, geneRequests(tracks), signal);
  return clusterAlignments(consensuses, tracks, new Set(queryTracks), genes);
}
