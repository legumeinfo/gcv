// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { pairwiseBlocksFeatureKey }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromModule from '@gcv/gene/store/reducers';
// app
import { memoizeArray } from '@gcv/core/utils';


export const getPairwiseBlocksState = createSelector(
  fromModule.getGeneModuleState,
  state => state[pairwiseBlocksFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  state => state.loading,
);


export const getLoaded = createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  state => state.loaded,
);


export const getFailed = createSelectorFactory(memoizeArray)(
  getPairwiseBlocksState,
  state => state.failed,
);
