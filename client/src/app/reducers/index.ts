// Angular
import { InjectionToken } from '@angular/core';
// NgRx
import * as fromRouterStore from '@ngrx/router-store';
import { Action, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
// store
import * as fromRouter from '@gcv/gene/store/reducers/router.reducer';
// app
import { environment } from '@gcv-environments/environment';


export interface State {
  router: fromRouterStore.RouterReducerState<fromRouter.RouterStateUrl>;
}


export const ROOT_REDUCERS = new InjectionToken<ActionReducerMap<State, Action>>
('Root reducers token', {
  factory: () => ({
    router: fromRouterStore.routerReducer,
  }),
});


export const metaReducers: Array<MetaReducer<State>> =
  environment.production ? [storeFreeze] : [];
