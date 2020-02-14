// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { chromosomeFeatureKey }
  from '@gcv/gene/store/reducers/chromosome.reducer';
// app
import { memoizeArray } from '@gcv/core/utils';


export const getChromosomeState = createSelector(
  fromModule.getGeneModuleState,
  state => state[chromosomeFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getChromosomeState,
  state => state.loading,
);
