// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../store/actions/router.actions";
import * as fromRoot from "../store/reducers";
// app
import { MicroTracksService } from "../services";

@Injectable()
export class SpanSearchGuard implements CanActivate {

  constructor(
    private microTracksService: MicroTracksService,
    private router: Router,
    private store: Store<fromRoot.State>) { }

  // this guard is only triggered when no server is provided, which Search needs,
  // so instead of activating it always redirects to the default server
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const span = route.params.span.split("-");
    this.microTracksService.getSearchFromSpan(
        route.params.chromosome,
        span[0],
        (span.length === 1 ? span[0] : span[1]),
        route.params.source)
      .subscribe((context) => {
        const url = "/search" + "/" + route.params.source + "/" + context.gene;
        this.store.dispatch(new routerActions.Go({
          path: [url],  // TODO: update url so back button skips search
          query: {"neighbors": context.neighbors}}));
      });
    return true;
  }
}
