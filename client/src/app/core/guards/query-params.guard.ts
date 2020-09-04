// Angular
import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PRIMARY_OUTLET, ActivatedRouteSnapshot, CanActivate, NavigationExtras,
  Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
// app
import { formControlConfigFactory, parseParams } from '@gcv/core/models/params';


@Injectable()
export class QueryParamsGuard implements CanActivate {

  constructor(
    private _fb: FormBuilder,
    private _router: Router,
    private _store: Store<fromRoot.State>,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
  Observable<UrlTree|boolean> {
    // parse query param strings to correct types
    // TODO: can this be done without using route data?
    const {paramMembers, paramParsers, paramValidators, paramsSelector} = route.data;
    const routeParams = parseParams(route.queryParams, paramParsers);
    // validate query params
    const controls =
      formControlConfigFactory(paramMembers, routeParams, paramValidators);
    const paramsGroup = this._fb.group(controls);
    paramsGroup.markAsDirty();
    return this._store.select(paramsSelector).pipe(
      map((params): UrlTree|boolean => {
        if (paramsGroup.valid) {
          return true;
        }
        const tree = this._router.parseUrl(state.url);
        const rootSegmentGroup = tree.root.children[PRIMARY_OUTLET];
        // TODO: is there a better way to generate the path string?
        const path = rootSegmentGroup.segments.map((s) => s.path).join('/');
        // replace invalid/missing params with those already in the store
        paramMembers.forEach((key) => {
          const errors = paramsGroup.get(key).errors;
          if (errors != null) {
            delete routeParams[key];
          }
        });
        const queryParams = Object.assign({}, params, routeParams);
        const commands = [path, route.params];
        const extras: NavigationExtras = {
            queryParams,
            queryParamsHandling: 'merge',
          };
        return this._router.createUrlTree(commands, extras);
      }),
    );
  }

}
