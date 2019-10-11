// NgRx
import { createSelector } from '@ngrx/store';
// store
import { pairwiseBlocksFeatureKey }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromModule from '@gcv/gene/store/reducers';


export const getPairwiseBlocksState = createSelector(
  fromModule.getGeneModuleState,
  state => state[pairwiseBlocksFeatureKey]
);
