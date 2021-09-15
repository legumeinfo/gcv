// Angular
import { Data, Params } from '@angular/router';
// store
import { RouterReducerState, routerReducer } from '@ngrx/router-store';


export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
  data: Data;
}


export interface State extends RouterReducerState<RouterStateUrl> { }


export const initialState: {state: RouterStateUrl, navigationId: number} = {
  state: {
    url: window.location.pathname + window.location.search,
    params: {},
    queryParams: {},
    data: {},
  },
  navigationId: -1,
}


export const reducer = routerReducer;
