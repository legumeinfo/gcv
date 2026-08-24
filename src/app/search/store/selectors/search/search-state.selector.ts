// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/search/store/reducers';
import { searchFeatureKey } from '@gcv/search/store/reducers/search.reducer';
// app
import { memoizeArray } from '@gcv/core/utils';

export const selectSearchState = createSelector(
  fromModule.selectSearchModuleState,
  (state) => state[searchFeatureKey],
);

export const getLoading = createSelectorFactory(memoizeArray)(
  selectSearchState,
  (state) => state.loading,
);

export const getLoaded = createSelectorFactory(memoizeArray)(
  selectSearchState,
  (state) => state.loaded,
);

export const getFailed = createSelectorFactory(memoizeArray)(
  selectSearchState,
  (state) => state.failed,
);
