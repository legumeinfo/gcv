// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router,
  UrlTree } from '@angular/router';
// app
import { AppConfig } from '@gcv/app.config';


@Injectable()
export class LegacyMultiRouteGuard implements CanActivate {

  private _sourceIDs: string[] = AppConfig.SERVERS.map((s) => s.id);

  constructor(private _router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): UrlTree {
    let url = '/';
    const params = {};
    if ('genes' in route.params) {
      url += 'gene';
      const genes = route.params.genes;
      this._sourceIDs.forEach((id) => {
        params[id] = genes;
      });
    }
    const path = [url, params];
    const extras: NavigationExtras = {
        queryParams: route.queryParams,
        queryParamsHandling: 'merge',
      };
    return this._router.createUrlTree(path, extras);
  }

}
