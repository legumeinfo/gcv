// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { geneID, GeneID, State } from '@gcv/gene/store/reducers/gene.reducer';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
import { getGeneState } from './gene-state.selector';
// app
import { memoizeArray } from '@gcv/core/utils';
import { Gene } from '@gcv/gene/models';


export const getSelectedGeneIDs = fromRouter.getRouteGenes;

export const getSelectedGenes = createSelectorFactory(memoizeArray)(
  getGeneState,
  getSelectedGeneIDs,
  (state: State, ids: GeneID[]): Gene[] => {
    const reducer = (accumulator, {name, source}) => {
        const id = geneID(name, source);
        if (id in state.entities) {
          accumulator[id] = state.entities[id];
        }
        return accumulator;
      };
    const selectedGenes = ids.reduce(reducer, {});
    return Object.values(selectedGenes);
  },
);

export const getUnloadedSelectedGeneIDs = createSelector(
  getGeneState,
  getSelectedGeneIDs,
  (state: State, ids: GeneID[]): GeneID[] => {
    const loadingIDs = new Set(state.loading.map(geneID));
    const loadedIDs = new Set(state.ids as string[]);
    const unloadedIDs = ids.filter((id) => {
        const idString = geneID(id);
        return !loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);
