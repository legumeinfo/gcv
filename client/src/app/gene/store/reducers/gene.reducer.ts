// A Gene is a second class citizen in the GCV, that is, other than dictating
// what chromosomes are loaded, all visualizations, algorithms, and auxiliary
// models are derived from the gene families of the Track model. As such, genes
// are loaded on an as needed basis. This file contains an NgRx reducer for
// storing Genes.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// store
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
// app
import { idArrayLeftDifferenceFactory, idArrayIntersectionFactory }
  from '@gcv/core/utils/id-array.util';
import { Gene } from '@gcv/gene/models';
import { ActionID } from '@gcv/store/utils';


declare var Object: any;  // because TypeScript doesn't support Object.values


export const geneFeatureKey = 'gene';


export type GeneID = {name: string, source: string};


export function geneID(name: string, source: string): string;
export function geneID({name, source}): string;
export function geneID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return geneID(id.name, id.source);
  }
  const [name, source] = args;
  return `${name}:${source}`;
}


const adapter = createEntityAdapter<Gene>({
  selectId: (e) => geneID(e.name, e.source)
});


export interface State extends EntityState<Gene> {
  failed: GeneID[];
  loaded: GeneID[];
  loading: (GeneID & ActionID)[];
}


const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],  // need for checking raw IDs
  loading: [],
});


export function geneActionID({action, ...gID}: GeneID & ActionID): string {
  return `${geneID(gID)}:${action}`;
}


export const idArrayLeftDifference =
  idArrayLeftDifferenceFactory(geneActionID, geneID);


export const idArrayIntersection =
  idArrayIntersectionFactory(geneActionID, geneID);


export function reducer(
  state = initialState,
  action: geneActions.Actions
): State {
  switch (action.type) {
    case geneActions.CLEAR:
      // TODO: can we just return the initial state?
      return adapter.removeAll({
        ...state,
        failed: [],
        loaded: [],
        loading: [],
      });
    case geneActions.GET:
      const {source, names} = action.payload;
      let targetIDs = names.map((name) => ({name, source, action: action.id}));
      // filter targets by loading and loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loading);
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      // add filtered target IDs to loading
      const loading = state.loading.concat(targetIDs);
      // remove filtered target IDs from failed
      const failed = idArrayLeftDifference(state.failed, targetIDs);
      return {
        ...state,
        loading,
        failed,
      };
    case geneActions.GET_SUCCESS:
    {
      const {genes} = action.payload;
      let targetIDs = genes.map(({name, source}) => ({name, source}));
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      const loaded = state.loaded.concat(targetIDs);
      return adapter.addMany(
        genes,
        {
          ...state,
          loading,
          loaded,
        },
      );
    }
    case geneActions.GET_FAILURE:
    {
      const {source, names} = action.payload;
      let targetIDs = names.map((name) => ({name, source}));
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to failed
      targetIDs = idArrayLeftDifference(targetIDs, state.failed);
      const failed = state.failed.concat(targetIDs);
      return {
        ...state,
        loading,
        failed,
      };
    }
    default:
      return state;
  }
}
