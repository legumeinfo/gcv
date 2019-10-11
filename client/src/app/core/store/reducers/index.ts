// NgRx
import * as fromRouterStore from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
// store
//import * as fromRouter from './router.reducer';


export interface State {
  //router: fromRouterStore.RouterReducerState<fromRouter.RouterStateUrl>;
  // TODO: fromRouter.RouterStateUrl should only be for gene module
  router: fromRouterStore.RouterReducerState<any>;
}


export const reducers: ActionReducerMap<State> = {
  router: fromRouterStore.routerReducer,
};
