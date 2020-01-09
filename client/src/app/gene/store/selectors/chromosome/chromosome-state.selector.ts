// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { chromosomeFeatureKey }
  from '@gcv/gene/store/reducers/chromosome.reducer';


export const getChromosomeState = createSelector(
  fromModule.getGeneModuleState,
  state => state[chromosomeFeatureKey]
);


export const getLoading = createSelector(
  getChromosomeState,
  state => state.loading,
);
