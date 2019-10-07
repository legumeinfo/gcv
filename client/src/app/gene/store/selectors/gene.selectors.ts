// NgRx
import { createSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { filter, map } from 'rxjs/operators';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import * as fromRouter from './router.selectors';
import { geneID, GeneID, State } from '@gcv/gene/store/reducers/gene.reducer';
// app
import { Gene } from '@gcv/gene/models';


export const getGeneState = createSelector(
  fromModule.getGeneModuleState,
  state => state['gene']
);

export const getSelectedGeneIDs = fromRouter.getRouteGenes;

export const getSelectedGenes = createSelector(
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
    const loadedIDs = new Set(state.loaded.map(geneID));
    const unloadedIDs = ids.filter((id) => {
        const idString = geneID(id);
        return !loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);

const getGeneStateAndSelectedGeneIDs = createSelector(
  getGeneState,
  getSelectedGeneIDs,
  (state: State, ids: GeneID[]) => ({state, ids}),
);

export const getSelectedGenesAfterLoadComplete = pipe(
  select(getGeneStateAndSelectedGeneIDs),
  filter(({state, ids}) => {
    const loadedIDs = state.loaded.map(geneID);
    const loadedIDset = new Set(loadedIDs);
    const failedIDs = state.failed.map(geneID);
    const failedIDset = new Set(failedIDs);
    const complete = ids
      .map(geneID)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
    return ids
      .map(geneID)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
  }),
  map(({state, ids}) => ids.map((id) => state.entities[geneID(id)])),
);

export const selectedLoaded = pipe(
  select(getGeneStateAndSelectedGeneIDs),
  map(({state, ids}) => {
    const loadedIDs = state.loaded.map(geneID);
    const loadedIDset = new Set(loadedIDs);
    const failedIDs = state.failed.map(geneID);
    const failedIDset = new Set(failedIDs);
    const complete = ids
      .map(geneID)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
    return ids
      .map(geneID)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
  }),
);
