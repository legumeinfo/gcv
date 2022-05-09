// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { familyFeatureKey } from '@gcv/gene/store/reducers/family.reducer'; 


export const getFamilyState = createSelector(
  fromModule.getGeneModuleState,
  state => state[familyFeatureKey]
);
