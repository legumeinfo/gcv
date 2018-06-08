// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../store/actions/router.actions";
import * as fromRoot from "../store/reducers";
// app
import { AppConfig } from "../app.config";

@Injectable()
export class DefaultSearchGuard implements CanActivate {

  constructor(private router: Router, private store: Store<fromRoot.State>) { }

  // this guard is only triggered when no server is provided, which Search needs,
  // so instead of activating it always redirects to the default server
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url = "/search" +
                "/" + AppConfig.getDefaultServer().id +
                "/" + route.params.gene;
    this.store.dispatch(new routerActions.Go({path: [url, {routeParam: 1}]}));
    return false;
  }
}
