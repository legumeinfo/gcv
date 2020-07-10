// store
import { Action, combineReducers, createFeatureSelector } from '@ngrx/store';
// reducers
import * as fromRoot from '@gcv/store/reducers';
import * as fromSearch from './search.reducer';


export const searchFeatureKey = 'searchmodule';


export interface SearchState {
  [fromSearch.searchFeatureKey]: fromSearch.State;
}


export interface State extends fromRoot.State {
  [searchFeatureKey]: SearchState;
}


export function reducers(state: SearchState | undefined, action: Action) {
  return combineReducers({
    [fromSearch.searchFeatureKey]: fromSearch.reducer,
  })(state, action);
}

// select the module's state
export const getSearchModuleState = createFeatureSelector<State, SearchState>
  (searchFeatureKey);
