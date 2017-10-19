// TODO: rehydrate store with meta-reducer and localStorage

// Angular
import { ActivatedRoute } from '@angular/router';
import { Injectable }     from '@angular/core';
import { Location }       from '@angular/common';
import { Observable }     from 'rxjs/Observable';
import { Router }         from '@angular/router';
import { Store }          from '@ngrx/store';

// App store
import { AppStore }       from '../models/app-store.model';
import { UrlQueryParams } from '../models/url-query-params.model';
import { StoreActions }   from '../constants/store-actions';

@Injectable()
export class UrlQueryParamsService {
  params: Observable<UrlQueryParams>;
  private _prev: any = {};

  constructor(private _route: ActivatedRoute,
              private _location: Location,
              private _router: Router,
              private _store: Store<AppStore>) {
    this.params = this._store.select('urlQueryParams');
    this.params.subscribe(params => {
      this._updateUrl(params);
    });
    this._route.queryParams.subscribe(params => {
      this._prev = params;
      this._updateStore(params);
    });
  }

  private _updateUrl(params: any): void {
    let extras = {queryParams: params, relativeTo: this._route};
    let url = this._router.createUrlTree([], extras).toString();
    if (Object.keys(this._prev).length == 0)
      this._location.replaceState(url);
    this._router.navigateByUrl(url);
  }

  private _updateStore(params: any): void {
    this._store.dispatch({type: StoreActions.ADD_QUERY_PARAMS, payload: params});
  }

  updateParams(params: any): void {
    this._updateStore(params);
	}
}
