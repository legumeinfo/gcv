// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { microTracksFeatureKey }
  from '@gcv/gene/store/reducers/micro-tracks.reducer'; 


export const getMicroTracksState = createSelector(
  fromModule.getGeneModuleState,
  state => state[microTracksFeatureKey]
);
