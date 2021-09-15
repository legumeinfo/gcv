// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { geneFeatureKey } from '@gcv/gene/store/reducers/gene.reducer';
// app
import { memoizeArray } from '@gcv/core/utils';
import { Gene } from '@gcv/gene/models';


export const getGeneState = createSelector(
  fromModule.getGeneModuleState,
  state => state[geneFeatureKey]
);


export const getLoading = createSelectorFactory(memoizeArray)(
  getGeneState,
  state => state.loading,
);


export const getFailed = createSelectorFactory(memoizeArray)(
  getGeneState,
  state => state.failed,
);


export const getLoaded = createSelectorFactory(memoizeArray)(
  getGeneState,
  state => {
    const genes: Gene[] = Object.values(state.entities);
    const ids = genes.map((g) => {
        let {name, source} = g;
        return {name, source};
      });
    return ids;
  },
);
