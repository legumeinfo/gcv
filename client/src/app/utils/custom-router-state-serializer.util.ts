import { Params, RouterStateSnapshot } from "@angular/router";
import { RouterStateSerializer } from "@ngrx/router-store";

export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}

// Only returns an object including the URL, params, and query params instead of
// the cumbersome RouterStateSnapshot
export class CustomRouterStateSerializer
implements RouterStateSerializer<RouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): RouterStateUrl {
    let route = routerState.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const { url, root: { queryParams } } = routerState;
    let { params } = route;

    if (params.genes) {
      params = Object.assign({}, params);
      params.genes = params.genes.split(",");
    }

    return { url, params, queryParams };
  }
}
