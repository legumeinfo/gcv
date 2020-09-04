// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { State } from '@gcv/search/store/reducers/search.reducer';
import { getSearchState } from './search-state.selector';
// app
import { memoizeArray } from '@gcv/core/utils';


export const getResultGenes = createSelectorFactory(memoizeArray)(
  getSearchState,
  (state: State): {source: string, name: string}[] => state.genes,
);


export const getResultRegions = createSelectorFactory(memoizeArray)(
  getSearchState,
  (state: State): {source: string, gene: string, neighbors: number}[] => {
    return state.regions;
  },
);
