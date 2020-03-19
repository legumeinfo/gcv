// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { geneID, GeneID, State } from '@gcv/gene/store/reducers/gene.reducer';
import { selectRouteParams } from '@gcv/store/selectors/router';
import { getGeneState } from './gene-state.selector';
// app
import { AppConfig } from '@gcv/app.config';
import { arrayFlatten, memoizeArray, memoizeValue, setIntersection }
  from '@gcv/core/utils';
import { Gene } from '@gcv/gene/models';


export const getSelectedGeneIDs = createSelectorFactory(memoizeArray)(
  selectRouteParams,
  (params): GeneID[] => {
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


export const getSelectedGenesLoaded = createSelectorFactory(memoizeValue)(
  getGeneState,
  getSelectedGeneIDs,
  (state: State, ids: GeneID[]): boolean => {
    const loaded = new Set(state.ids as string[]);
    state.failed.map(geneID).forEach(loaded.add, loaded);
    const selected = new Set(ids.map(geneID));
    const intersection = setIntersection(loaded, selected);
    return selected.size == intersection.size && selected.size > 0;
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
