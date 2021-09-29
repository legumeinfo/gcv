// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router,
  UrlTree } from '@angular/router';
import { AppConfig } from '@gcv/core/models';


@Injectable()
export class LegacyMultiRouteGuard implements CanActivate {

  private _sourceIDs: string[];

  constructor(private _appConfig: AppConfig,
              private _router: Router) {
    this._sourceIDs = _appConfig.getServerIDs();
  }

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
