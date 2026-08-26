// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { familyFeatureKey } from '@gcv/gene/store/reducers/family.reducer';

export const selectFamilyState = createSelector(
  fromModule.selectGeneModuleState,
  (state) => state[familyFeatureKey],
);
