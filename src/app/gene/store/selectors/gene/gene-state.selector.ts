// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { geneFeatureKey } from '@gcv/gene/store/reducers/gene.reducer';
// app
import { memoizeArray } from '@gcv/core/utils';
import { Gene } from '@gcv/gene/models';

export const selectGeneState = createSelector(
  fromModule.selectGeneModuleState,
  (state) => state[geneFeatureKey],
);

export const getLoading = createSelectorFactory(memoizeArray)(
  selectGeneState,
  (state) => state.loading,
);

export const getFailed = createSelectorFactory(memoizeArray)(
  selectGeneState,
  (state) => state.failed,
);

export const getLoaded = createSelectorFactory(memoizeArray)(
  selectGeneState,
  (state) => {
    const genes: Gene[] = Object.values(state.entities);
    const ids = genes.map((g) => {
      const { name, source } = g;
      return { name, source };
    });
    return ids;
  },
);
