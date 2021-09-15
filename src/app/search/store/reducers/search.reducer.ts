// store
import * as searchActions from '@gcv/search/store/actions/search.actions';
// app
import { idArrayLeftDifferenceFactory, idArrayIntersectionFactory }
  from '@gcv/core/utils/id-array.util';
import { ActionID } from '@gcv/store/utils';


export const searchFeatureKey = 'search';


export type SearchID = {source: string};


export function searchID(source: string): string;
export function searchID({source}): string;
export function searchID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return searchID(id.source);
  }
  const [source] = args;
  return `${source}`;
}


export interface State {
  loading: (SearchID & ActionID)[];
  loaded: SearchID[];
  failed: SearchID[];
  genes: {source: string, name: string}[];
  regions: {source: string, gene: string, neighbors: number}[];
}


const initialState: State = {
  loading: [],
  loaded: [],
  failed: [],
  genes: [],
  regions: [],
};


export function searchActionID({action, ...sID}: SearchID & ActionID): string {
  return `${searchID(sID)}:${action}`;
}


export const idArrayLeftDifference =
  idArrayLeftDifferenceFactory(searchActionID, searchID);


export const idArrayIntersection =
  idArrayIntersectionFactory(searchActionID, searchID);


export const reducer = (
  state = initialState,
  action: searchActions.Actions,
): State => {
  switch (action.type) {
    case searchActions.CLEAR:
    {
      return {
        ...state,
        loading: [],
        loaded: [],
        failed: [],
        genes: [],
        regions: [],
      };
    }
    case searchActions.SEARCH:
    {
      const {query, source} = action.payload;
      let targetIDs = [{source, action: action.id}];
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
    }
    case searchActions.SEARCH_SUCCESS:
    {
      const {result, source} = action.payload;
      let targetIDs = [{source}];
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      const loaded = state.loaded.concat(targetIDs);
      // update results
      const resultGenes = result.genes.map((name) => ({source, name}));
      const genes = state.genes.concat(resultGenes);
      const resultRegions = result.regions.map((region) => ({source, ...region}));
      const regions = state.regions.concat(resultRegions);
      return {
        ...state,
        loading,
        loaded,
        genes,
        regions,
      };
    }
    case searchActions.SEARCH_FAILURE:
    {
      const {source} = action.payload;
      let targetIDs = [{source}];
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
