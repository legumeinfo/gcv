// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { geneFeatureKey } from '@gcv/gene/store/reducers/gene.reducer';
// app
import { memoizeArray } from '@gcv/core/utils';


export const getGeneState = createSelector(
  fromModule.getGeneModuleState,
  state => state[geneFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getGeneState,
  state => state.loading,
);
