// Angular
import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router,
  UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { Params, formControlConfigFactory, paramMembers, paramParser,
  paramValidators }from '@gcv/gene/models/params';


@Injectable()
export class QueryParamsGuard implements CanActivate {

  constructor(
    private _fb: FormBuilder,
    private _router: Router,
    private _store: Store<fromRoot.State>,
  ) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<UrlTree|boolean> {
    // parse query param strings to correct types
    const routeParams = paramParser(route.queryParams);
    // validate query params
    const controls =
      formControlConfigFactory(paramMembers, routeParams, paramValidators);
    const paramsGroup = this._fb.group(controls);
    paramsGroup.markAsDirty();
    return this._store.select(fromParams.getParams).pipe(
      map((params: Params): UrlTree|boolean => {
        if (paramsGroup.valid) {
          return true;
        }
        // replace invalid/missing params with those already in the store
        paramMembers.forEach((key) => {
          const errors = paramsGroup.get(key).errors;
          if (errors != null) {
            delete routeParams[key];
          }
        });
        const queryParams = Object.assign({}, params, routeParams);
        // TODO: don't hard-code the path
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
