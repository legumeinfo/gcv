// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router,
  UrlTree } from '@angular/router';
// app
import { AppConfig } from '@gcv/core/models';


@Injectable()
export class LegacySearchRouteGuard implements CanActivate {

  constructor(private _appConfig: AppConfig, private _router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): UrlTree {
    let url = '/';
    const params = {};
    if ('gene' in route.params) {
      url += 'gene';
      const source = route.params.source || this._appConfig.getDefaultServer().id;
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
