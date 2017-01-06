// TODO: investigate replacing with @ngrx/router-store
// TODO: rehydrate store with meta-reducer and localStorage

// Angular
import { ActivatedRoute } from '@angular/router';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Router }         from '@angular/router';
import { Store }          from '@ngrx/store';

// App store
import { AppStore }         from '../models/app-store.model';
import { UrlQueryParams }   from '../models/url-query-params.model';
import { ADD_QUERY_PARAMS } from '../constants/actions';

@Injectable()
export class UrlQueryParamsService {
  params: Observable<UrlQueryParams>;

  constructor(private _route: ActivatedRoute,
              private _router: Router,
              private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.params = this._store.select('urlQueryParams');
    this.params.subscribe(params => {
      this._updateUrl(params);
    });
    this._route.queryParams.subscribe(params => {
      this._updateStore(params);
    });
  }

  private _updateUrl(params: any): void {
    this._router.navigate([], {queryParams: params, relativeTo: this._route});
  }

  private _updateStore(params: any): void {
    this._store.dispatch({type: ADD_QUERY_PARAMS, payload: params});
  }

  updateParams(params: any): void {
    this._updateStore(params);
	}
}
