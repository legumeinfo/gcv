// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router,
  UrlTree } from '@angular/router';
// app
import { AppConfig } from '@gcv/app.config';


@Injectable()
export class LegacySearchRouteGuard implements CanActivate {

  constructor(private _router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): UrlTree {
    let url = '/';
    const params = {};
    if ('gene' in route.params) {
      url += 'gene';
      const source = route.params.source || AppConfig.getDefaultServer().id;
      const gene = route.params.gene;
      params[source] = gene;
    }
    const path = [url, params];
    const extras: NavigationExtras = {
        queryParams: route.queryParams,
        queryParamsHandling: 'merge',
      };
    return this._router.createUrlTree(path, extras);
  }

}
