// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { layoutFeatureKey }
  from '@gcv/gene/store/reducers/layout.reducer'; 


export const getLayoutState = createSelector(
  fromModule.getGeneModuleState,
  state => state[layoutFeatureKey]
);
