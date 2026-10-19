// What an agent needs to know about the gene view: which query genes loaded,
// how they clustered, which searches finished, and whether the view has
// settled, i.e. every request the current URL implies has succeeded or failed.
import { Store, createSelector } from '@ngrx/store';
import { Observable, firstValueFrom } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
// store
import * as fromRoot from '@gcv/store/reducers';
import { geneFeatureKey } from '@gcv/gene/store/reducers';
import { GeneID, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import {
  microTrackID,
  partialMicroTrackID,
} from '@gcv/gene/store/reducers/micro-tracks.reducer';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { TrackID, trackID } from '@gcv/gene/store/utils';
import {
  selectChromosomeLoadStates,
  selectGeneLoadStates,
  selectMicroTrackLoadStates,
} from '@gcv/gene/services/process.selectors';
// app
import { waitFor } from '@gcv/core/webmcp/webmcp';
import { Gene, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { Params, SourceParams } from '@gcv/gene/models/params';

export type AlignedTrack = Track & ClusterMixin & AlignmentMixin;

export type LoadStatus = 'loaded' | 'failed' | 'loading' | 'pending';

export type ViewStatus = 'empty' | 'loading' | 'ready' | 'partial' | 'error';

type LoadStates<T> = readonly [T[], T[], T[]]; // [loading, loaded, failed]

export type GeneViewInputs = {
  selectedGeneIDs: GeneID[];
  geneLoadStates: LoadStates<GeneID>;
  chromosomeIDs: TrackID[];
  chromosomeLoadStates: LoadStates<TrackID>;
  query: { consensuses: string[][]; tracks: AlignedTrack[] };
  tracks: AlignedTrack[];
  microTrackLoadStates: LoadStates<{ cluster: number; source: string }>;
  params: Params;
};

export type GeneViewSummary = {
  status: ViewStatus;
  settled: boolean;
  queryGenes: { name: string; source: string; status: LoadStatus }[];
  clusters: {
    cluster: number;
    consensusLength: number;
    queryTracks: {
      source: string;
      genus: string;
      species: string;
      chromosome: string;
      firstGene: string;
      lastGene: string;
      genes: number;
    }[];
    searches: Record<string, LoadStatus>;
    resultTracks: number;
    resultAlignments: number;
  }[];
  issues: string[];
  parameters: Params;
};

export const selectGeneViewInputs = createSelector(
  fromGenes.getSelectedGeneIDs,
  selectGeneLoadStates,
  fromChromosome.getSelectedChromosomeIDs,
  selectChromosomeLoadStates,
  fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks,
  fromMicroTracks.getAllClusteredAndAlignedMicroTracks,
  selectMicroTrackLoadStates,
  fromParams.getParams,
  (
    selectedGeneIDs,
    geneLoadStates,
    chromosomeIDs,
    chromosomeLoadStates,
    query,
    tracks,
    microTrackLoadStates,
    params,
  ): GeneViewInputs => ({
    selectedGeneIDs,
    geneLoadStates,
    chromosomeIDs,
    chromosomeLoadStates,
    query,
    tracks,
    microTrackLoadStates,
    params,
  }),
);

function statusFactory<T>(
  [loading, loaded, failed]: LoadStates<T>,
  toID: (id: T) => string,
): (id: string) => LoadStatus {
  const sets = {
    loading: new Set(loading.map(toID)),
    loaded: new Set(loaded.map(toID)),
    failed: new Set(failed.map(toID)),
  };
  return (id) => {
    if (sets.loaded.has(id)) return 'loaded';
    if (sets.failed.has(id)) return 'failed';
    if (sets.loading.has(id)) return 'loading';
    return 'pending';
  };
}

const done = (status: LoadStatus) => status === 'loaded' || status === 'failed';

export function summarizeGeneView(inputs: GeneViewInputs): GeneViewSummary {
  const { selectedGeneIDs, query, tracks, params } = inputs;
  const issues: string[] = [];
  const geneStatus = statusFactory(inputs.geneLoadStates, geneID);
  const queryGenes = selectedGeneIDs.map(({ name, source }) => ({
    name,
    source,
    status: geneStatus(geneID(name, source)),
  }));
  queryGenes
    .filter((g) => g.status === 'failed')
    .forEach((g) =>
      issues.push(`Query gene ${g.name} could not be loaded from ${g.source}`),
    );
  const chromosomeStatus = statusFactory(inputs.chromosomeLoadStates, trackID);
  const chromosomes = inputs.chromosomeIDs.map((id) => ({
    ...id,
    status: chromosomeStatus(trackID(id)),
  }));
  chromosomes
    .filter((c) => c.status === 'failed')
    .forEach((c) =>
      issues.push(`Chromosome ${c.name} could not be loaded from ${c.source}`),
    );
  const queryLoaded =
    queryGenes.every((g) => done(g.status)) &&
    chromosomes.every((c) => done(c.status));
  // clusters exist only once the query genes and chromosomes have loaded
  const searchStatus = statusFactory(
    inputs.microTrackLoadStates,
    partialMicroTrackID,
  );
  const queryTrackSet = new Set(query.tracks);
  const clusterIDs = Array.from(new Set(query.tracks.map((t) => t.cluster)));
  const clusters = clusterIDs.map((cluster) => {
    const queryTracks = query.tracks
      .filter((t) => t.cluster === cluster)
      .map((t) => ({
        source: t.source,
        genus: t.genus,
        species: t.species,
        chromosome: t.name,
        firstGene: t.genes[0],
        lastGene: t.genes[t.genes.length - 1],
        genes: t.genes.length,
      }));
    const searches: Record<string, LoadStatus> = {};
    (params as SourceParams).sources.forEach((source) => {
      searches[source] = searchStatus(partialMicroTrackID(cluster, source));
      if (searches[source] === 'failed') {
        issues.push(`The ${source} search for cluster ${cluster} failed`);
      }
    });
    const results = tracks.filter(
      (t) => t.cluster === cluster && !queryTrackSet.has(t),
    );
    return {
      cluster,
      consensusLength: (query.consensuses[cluster] ?? []).length,
      queryTracks,
      searches,
      resultTracks: new Set(results.map((t) => microTrackID(t))).size,
      resultAlignments: results.length,
    };
  });
  const searchesDone = clusters.every((c) =>
    Object.values(c.searches).every(done),
  );
  // with no clusters once the query has loaded, there is nothing to search
  const settled =
    queryGenes.length === 0 ||
    (queryLoaded && (clusters.length === 0 || searchesDone));
  let status: ViewStatus;
  if (queryGenes.length === 0) {
    status = 'empty';
  } else if (!settled) {
    status = 'loading';
  } else if (clusters.length === 0) {
    status = 'error';
  } else {
    status = issues.length > 0 ? 'partial' : 'ready';
  }
  return {
    status,
    settled,
    queryGenes,
    clusters,
    issues,
    parameters: params,
  };
}

// the gene module registers its feature state when it first loads
const selectGeneModuleLoaded = (state: fromRoot.State) =>
  (state as { [geneFeatureKey]?: unknown })[geneFeatureKey] !== undefined;

// Emits the view's summary each time it has been stable for a moment, so a
// burst of store updates (e.g. clearing then re-requesting) reads as one.
export function geneViewSummaries(_store: Store): Observable<GeneViewSummary> {
  return _store
    .select(selectGeneViewInputs)
    .pipe(debounceTime(150), map(summarizeGeneView));
}

export async function currentGeneView(_store: Store): Promise<GeneViewSummary> {
  return summarizeGeneView(
    await firstValueFrom(_store.select(selectGeneViewInputs)),
  );
}

// Waits until the view settles; on timeout, returns the unsettled summary.
export async function waitForSettledGeneView(
  _store: Store,
  options: { signal?: AbortSignal; timeoutMs: number },
): Promise<GeneViewSummary & { timedOut?: true }> {
  const moduleLoaded = await waitFor(
    _store.select(selectGeneModuleLoaded),
    (loaded) => loaded,
    options,
  );
  if (moduleLoaded.timedOut) {
    throw new Error('The gene view did not load');
  }
  const settled = await waitFor(
    geneViewSummaries(_store),
    (s) => s.settled,
    options,
  );
  if (!settled.timedOut) {
    return settled.value;
  }
  return { ...(await currentGeneView(_store)), timedOut: true };
}

// Requests the genes of the given tracks and waits until each has loaded or
// failed; returns the loaded genes keyed by geneID(name, source).
export async function loadGenes(
  _store: Store,
  requests: { names: string[]; source: string }[],
  dispatch: (request: { names: string[]; source: string }) => void,
  options: { signal?: AbortSignal; timeoutMs: number },
): Promise<Map<string, Gene>> {
  requests.forEach(dispatch);
  const ids = new Set(
    requests.flatMap(({ names, source }) =>
      names.map((name) => geneID(name, source)),
    ),
  );
  const selectGeneOutcome = createSelector(
    fromGenes.selectGeneState,
    (state) => {
      const failed = new Set(state.failed.map((id) => geneID(id)));
      const genes = new Map<string, Gene>();
      let pending = 0;
      ids.forEach((id) => {
        const gene = state.entities[id];
        if (gene !== undefined) {
          genes.set(id, gene);
        } else if (!failed.has(id)) {
          pending += 1;
        }
      });
      return { genes, pending };
    },
  );
  const result = await waitFor(
    _store.select(selectGeneOutcome),
    ({ pending }) => pending === 0,
    options,
  );
  if (result.timedOut) {
    return (await firstValueFrom(_store.select(selectGeneOutcome))).genes;
  }
  return result.value.genes;
}
