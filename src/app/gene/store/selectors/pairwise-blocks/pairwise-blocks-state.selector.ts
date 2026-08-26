// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { pairwiseBlocksFeatureKey } from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromModule from '@gcv/gene/store/reducers';
// app
import { memoizeArray } from '@gcv/core/utils';

export const selectPairwiseBlocksState = createSelector(
  fromModule.selectGeneModuleState,
  (state) => state[pairwiseBlocksFeatureKey],
);

export const getLoading = createSelectorFactory(memoizeArray)(
  selectPairwiseBlocksState,
  (state) => state.loading,
);

export const getLoaded = createSelectorFactory(memoizeArray)(
  selectPairwiseBlocksState,
  (state) => state.loaded,
);

export const getFailed = createSelectorFactory(memoizeArray)(
  selectPairwiseBlocksState,
  (state) => state.failed,
);
