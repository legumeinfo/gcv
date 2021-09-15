// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/search/store/reducers';
import { searchFeatureKey } from '@gcv/search/store/reducers/search.reducer';
// app
import { memoizeArray } from '@gcv/core/utils';


export const getSearchState = createSelector(
  fromModule.getSearchModuleState,
  state => state[searchFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getSearchState,
  state => state.loading,
);


export const getLoaded = createSelectorFactory(memoizeArray)(
  getSearchState,
  state => state.loaded,
);


export const getFailed = createSelectorFactory(memoizeArray)(
  getSearchState,
  state => state.failed,
);
