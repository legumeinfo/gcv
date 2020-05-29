// Angular
import { Data, Params } from '@angular/router';
// NgRx
import { createSelector } from '@ngrx/store';
// store
import { getRouter } from '@gcv/store/reducers';
import { RouterStateUrl, State } from '@gcv/store/reducers/router.reducer';


export const getRouterState = createSelector(
  getRouter,
  (routerState: State) => routerState.state,
);


// select the current route query params
export const selectQueryParams = createSelector(
  getRouterState,
  (state: RouterStateUrl): Params => state.queryParams,
);


// factory function to select a query param
export const selectQueryParam = (param: string): any => createSelector(
  selectQueryParam,
  (params: Params) => params[param],
);


// select the current route params
export const selectRouteParams = createSelector(
  getRouterState,
  (state: RouterStateUrl): Params => state.params,
);


// factory function to select a route param
export const selectRouteParam = (param: string): any => createSelector(
  selectRouteParam,
  (params: Params) => param[param],
);


// select the current route data
//export const selectRouteData = createSelector(
//  getRouterState,
//  (state: RouterStateUrl): Data => state.data,
//);


// select the current url
export const selectUrl = createSelector(
  getRouterState,
  (state: RouterStateUrl): string => state.url,
);
