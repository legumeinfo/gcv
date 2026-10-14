// Composed selectors for ProcessService. These replace the
// combineLatest(store.select(a), store.select(b), …) patterns the service used
// to derive its process/status streams: a single memoized selector returns the
// same tuple the downstream pipe already destructures, so behavior is preserved
// (see process.service.spec.ts) while satisfying @ngrx/avoid-combining-selectors.
import { createSelector } from '@ngrx/store';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromParams from '@gcv/gene/store/selectors/params';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks';

// [loading, loaded, failed] load-state tuples
export const selectGeneLoadStates = createSelector(
  fromGenes.getLoading,
  fromGenes.getLoaded,
  fromGenes.getFailed,
  (loading, loaded, failed) => [loading, loaded, failed] as const,
);

export const selectChromosomeLoadStates = createSelector(
  fromChromosome.getLoading,
  fromChromosome.getLoaded,
  fromChromosome.getFailed,
  (loading, loaded, failed) => [loading, loaded, failed] as const,
);

export const selectMicroTrackLoadStates = createSelector(
  fromMicroTracks.getLoading,
  fromMicroTracks.getLoaded,
  fromMicroTracks.getFailed,
  (loading, loaded, failed) => [loading, loaded, failed] as const,
);

export const selectPairwiseBlockLoadStates = createSelector(
  fromPairwiseBlocks.getLoading,
  fromPairwiseBlocks.getLoaded,
  fromPairwiseBlocks.getFailed,
  (loading, loaded, failed) => [loading, loaded, failed] as const,
);

// selected/aligned "loaded" flags + the relevant micro-track set
export const selectClusteringInputs = createSelector(
  fromGenes.getSelectedGenesLoaded,
  fromChromosome.getSelectedChromosomesLoaded,
  fromMicroTracks.getClusteredSelectedMicroTracks,
  (genesLoaded, chromosomesLoaded, tracks) =>
    [genesLoaded, chromosomesLoaded, tracks] as const,
);

export const selectQueryAlignmentInputs = createSelector(
  fromGenes.getSelectedGenesLoaded,
  fromChromosome.getSelectedChromosomesLoaded,
  fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks,
  (genesLoaded, chromosomesLoaded, aligned) =>
    [genesLoaded, chromosomesLoaded, aligned] as const,
);

// micro-track sets
export const selectAllMicroTracks = createSelector(
  fromMicroTracks.getSelectedMicroTracks,
  fromMicroTracks.getActiveSearchMicroTracks,
  (selected, search) => [selected, search] as const,
);

export const selectTrackGeneInputs = createSelector(
  fromMicroTracks.getSelectedMicroTracks,
  fromMicroTracks.getActiveSearchMicroTracks,
  fromGenes.getLoading,
  fromGenes.getLoaded,
  fromGenes.getFailed,
  (selected, search, loading, loaded, failed) =>
    [selected, search, loading, loaded, failed] as const,
);

export const selectSearchTrackAlignmentInputs = createSelector(
  fromMicroTracks.getActiveSearchMicroTracks,
  fromMicroTracks.getClusteredAndAlignedSearchMicroTracks,
  (tracks, alignedTracks) => [tracks, alignedTracks] as const,
);

// parameter groups
export const selectQueryAndSourceParams = createSelector(
  fromParams.getQueryParams,
  fromParams.getSourceParams,
  (queryParams, sourceParams) => [queryParams, sourceParams] as const,
);

export const selectQuerySourceAlignmentParams = createSelector(
  fromParams.getQueryParams,
  fromParams.getSourceParams,
  fromParams.getAlignmentParams,
  (queryParams, sourceParams, alignment) =>
    [queryParams, sourceParams, alignment] as const,
);

export const selectSourceAndBlockParams = createSelector(
  fromParams.getSourceParams,
  fromParams.getBlockParams,
  (sourceParams, blockParams) => [sourceParams, blockParams] as const,
);
