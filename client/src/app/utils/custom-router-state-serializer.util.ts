import { Params, RouterStateSnapshot } from "@angular/router";
import { RouterStateSerializer } from "@ngrx/router-store";
import * as fromRouter from "../store/reducers/router.store";

// Returns an object including only the URL, params, and query params instead of
// the cumbersome RouterStateSnapshot. Also converts the params and query params
// values into types that the application expects.
export class CustomRouterStateSerializer
implements RouterStateSerializer<fromRouter.RouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): fromRouter.RouterStateUrl {
    let route = routerState.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    let { url, root: { queryParams } } = routerState;
    let { params } = route;

    // convert route params into expected types
    if (params.genes) {
      params = Object.assign({}, params);
      params.genes = params.genes.split(",");
    }

    // convert route query params into expected types
    queryParams = Object.assign({}, queryParams);
    Object.keys(queryParams).forEach(function(key, index) {
      switch(key) {
        // macro query params
        case 'bmatched':
        case 'bintermediate':
        case 'bmask':
        // micro query params
        case 'neighbors':
        case 'matched':
        case 'intermediate':
        // alignment params
        case 'match':
        case 'mismatch':
        case 'gap':
        case 'score':
        // clustering params
        case 'threshold':
        case 'kappa':
        case 'minsup':
        case 'minsize':
          queryParams[key] = parseInt(queryParams[key]);
          break;
        case 'alpha':
          queryParams[key] = parseFloat(queryParams[key]);
          break;
        case 'sources':
          if (!Array.isArray(queryParams[key])) {
            queryParams[key] = queryParams[key].split(",");
          }
          break;
      }
    });

    return { url, params, queryParams };
  }
}
