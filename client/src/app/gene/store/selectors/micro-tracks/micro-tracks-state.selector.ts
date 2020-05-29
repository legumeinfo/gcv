// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { microTracksFeatureKey }
  from '@gcv/gene/store/reducers/micro-tracks.reducer'; 
// app
import { memoizeArray } from '@gcv/core/utils';


export const getMicroTracksState = createSelector(
  fromModule.getGeneModuleState,
  state => state[microTracksFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getMicroTracksState,
  state => state.loading,
);


export const getFailed = createSelectorFactory(memoizeArray)(
  getMicroTracksState,
  state => state.failed,
);


export const getLoaded = createSelectorFactory(memoizeArray)(
  getMicroTracksState,
  state => state.loaded,
);
