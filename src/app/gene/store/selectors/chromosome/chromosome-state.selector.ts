// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { chromosomeFeatureKey }
  from '@gcv/gene/store/reducers/chromosome.reducer';
// app
import { Track } from '@gcv/gene/models';
import { memoizeArray } from '@gcv/core/utils';


export const getChromosomeState = createSelector(
  fromModule.getGeneModuleState,
  state => state[chromosomeFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getChromosomeState,
  state => state.loading,
);


export const getFailed = createSelectorFactory(memoizeArray)(
  getChromosomeState,
  state => state.failed,
);


export const getLoaded = createSelectorFactory(memoizeArray)(
  getChromosomeState,
  state => {
    const chromosomes: Track[] = Object.values(state.entities);
    const ids = chromosomes.map((c) => {
        let {name, source} = c;
        return {name, source};
      });
    return ids;
  },
);
