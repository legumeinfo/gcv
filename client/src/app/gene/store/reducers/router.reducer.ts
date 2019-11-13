import { Params } from '@angular/router';
import * as fromRouterStore from '@ngrx/router-store';
import { QueryParams } from '@gcv/gene/models/params';


export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}


export const initialState: {state: RouterStateUrl, navigationId: number} = {
  state: {
    url: window.location.pathname + window.location.search,
    params: {},
    queryParams: {}
  },
  navigationId: 0,
}
