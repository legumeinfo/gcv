// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router,
  UrlTree } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/reducers';
import * as fromRouter from '@gcv/gene/store/selectors/router';


@Injectable()
export class QueryParamsGuard implements CanActivate {

  constructor(
    private _router: Router,
    private _store: Store<fromRoot.State>,
  ) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<UrlTree|boolean> {
    return combineLatest(
      // TODO: should there be a selector for this?
      this._store.select(fromRouter.getSourceParams)
        .pipe(map((p) => p.asObject())),
      this._store.select(fromRouter.getMicroQueryParams)
        .pipe(map((p) => p.asObject())),
      this._store.select(fromRouter.getMicroAlignmentParams)
        .pipe(map((p) => p.asObject())),
      this._store.select(fromRouter.getMacroBlockParams)
        .pipe(map((p) => p.asObject())),
      this._store.select(fromRouter.getMicroClusteringParams)
        .pipe(map((p) => p.asObject())),
      this._store.select(fromRouter.getMacroFilterParamsObject),
      this._store.select(fromRouter.getMicroFilterParamsObject),
    ).pipe(
      map((separateQueryParams: Object[]) => {
        const queryParams = Object.assign({}, ...separateQueryParams);
        if (Object.keys(queryParams).every((p) => p in route.queryParams)) {
          return true;
        }
        Object.assign(queryParams, route.queryParams);
        // TODO: don't hard-code the path!
        const path = ['gene', route.params];
        const extras: NavigationExtras = {
            queryParams,
            queryParamsHandling: 'merge',
          };
        return this._router.createUrlTree(path, extras);
      }),
    );
  }

}
