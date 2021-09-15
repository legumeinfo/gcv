// Angular
import { RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer } from '@ngrx/router-store';
// app
import * as fromRouter from '@gcv/store/reducers/router.reducer';
import { Injectable } from "@angular/core";

// Returns an object including only the URL, params, query params, and data
// instead of the cumbersome RouterStateSnapshot
@Injectable()
export class CustomRouterStateSerializer
implements RouterStateSerializer<fromRouter.RouterStateUrl> {

  serialize(routerState: RouterStateSnapshot): fromRouter.RouterStateUrl {
    let route = routerState.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const {url, root: {queryParams}} = routerState;
    const {params, data} = route;

    return {url, params, queryParams, data};
  }

}
