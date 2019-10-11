// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { geneFeatureKey } from '@gcv/gene/store/reducers/gene.reducer';


export const getGeneState = createSelector(
  fromModule.getGeneModuleState,
  state => state[geneFeatureKey]
);
