// Angular
import { InjectionToken } from '@angular/core';
// NgRx
import * as fromRouterStore from '@ngrx/router-store';
import { Action, ActionReducerMap, MetaReducer, createFeatureSelector }
  from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
// store
import * as fromRouter from './router.reducer';
// app
import { environment } from '@gcv-environments/environment';


export interface State {
  routerReducer: fromRouter.State;
}


export const reducers: ActionReducerMap<State> = {
  routerReducer: fromRouter.reducer,
};


export const getRouter = createFeatureSelector<fromRouter.State>('routerReducer');


// add environment-specific meta reducers here
export const metaReducers: Array<MetaReducer<State>> =
  environment.production ? [storeFreeze] : [];
