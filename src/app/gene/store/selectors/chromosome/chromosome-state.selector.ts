// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { chromosomeFeatureKey } from '@gcv/gene/store/reducers/chromosome.reducer';
// app
import { Track } from '@gcv/gene/models';
import { memoizeArray } from '@gcv/core/utils';

export const selectChromosomeState = createSelector(
  fromModule.selectGeneModuleState,
  (state) => state[chromosomeFeatureKey],
);

export const getLoading = createSelectorFactory(memoizeArray)(
  selectChromosomeState,
  (state) => state.loading,
);

export const getFailed = createSelectorFactory(memoizeArray)(
  selectChromosomeState,
  (state) => state.failed,
);

export const getLoaded = createSelectorFactory(memoizeArray)(
  selectChromosomeState,
  (state) => {
    const chromosomes: Track[] = Object.values(state.entities);
    const ids = chromosomes.map((c) => {
      const { name, source } = c;
      return { name, source };
    });
    return ids;
  },
);
