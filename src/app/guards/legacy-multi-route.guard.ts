// Angular
import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationExtras, Router, UrlTree } from '@angular/router';
import { AppConfig } from '@gcv/core/models';


@Injectable()
export class LegacyMultiRouteGuard  {
  private _appConfig = inject(AppConfig);
  private _router = inject(Router);


  private _sourceIDs: string[];

  constructor() {
    const _appConfig = this._appConfig;

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
