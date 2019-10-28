// Only used for global plots since local plots are derived from micro-tracks.

// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { plotFeatureKey }
  from '@gcv/gene/store/reducers/plot.reducer'; 


export const getPlotState = createSelector(
  fromModule.getGeneModuleState,
  state => state[plotFeatureKey]
);
