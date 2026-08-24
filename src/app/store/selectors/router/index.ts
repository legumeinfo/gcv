// Angular
import { Params } from '@angular/router';
// NgRx
import { createSelector } from '@ngrx/store';
// store
import { selectRouter } from '@gcv/store/reducers';
import { RouterStateUrl, State } from '@gcv/store/reducers/router.reducer';

export const selectRouterState = createSelector(
  selectRouter,
  (routerState: State) => routerState.state,
);

// select the current route query params
export const selectQueryParams = createSelector(
  selectRouterState,
  (state: RouterStateUrl): Params => state.queryParams,
);

// factory function to select a query param
export const selectQueryParam = (param: string): any =>
  createSelector(selectQueryParam, (params: Params) => params[param]);

// select the current route params
export const selectRouteParams = createSelector(
  selectRouterState,
  (state: RouterStateUrl): Params => state.params,
);

// factory function to select a route param
export const selectRouteParam = (param: string): any =>
  createSelector(selectRouteParam, (params: Params) => param[param]);

// select the current route data
//export const selectRouteData = createSelector(
//  selectRouterState,
//  (state: RouterStateUrl): Data => state.data,
//);

// select the current url
export const selectUrl = createSelector(
  selectRouterState,
  (state: RouterStateUrl): string => state.url,
);
