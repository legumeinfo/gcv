// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { geneID, GeneID, State } from '@gcv/gene/store/reducers/gene.reducer';
import { selectRouteParams } from '@gcv/store/selectors/router';
import { getGeneState } from './gene-state.selector';
// app
import { AppConfig } from '@gcv/app.config';
import { arrayFlatten, memoizeArray } from '@gcv/core/utils';
import { Gene } from '@gcv/gene/models';


export const getSelectedGeneIDs = createSelector(
  selectRouteParams,
  (params): {name: string, source: string}[] => {
    // assumes is defined (see QueryParamsGuard)
    const sources = AppConfig.SERVERS.map((s) => s.id);
    const selectedGenes = sources
      .filter((source) => source in params)
      .map((source) => {
        const names = params[source].split(',');
        return names.map((name) => ({source, name}));
      });
    return arrayFlatten(selectedGenes);
  },
);


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
