// TODO: rehydrate store with meta-reducer and localStorage

// Angular
import { ActivatedRoute, RoutesRecognized } from '@angular/router';
import { Injectable }                       from '@angular/core';
import { Location }                         from '@angular/common';
import { Observable }                       from 'rxjs/Observable';
import { Router }                           from '@angular/router';
import { Store }                            from '@ngrx/store';

// App store
import { AlignmentParams } from '../models/alignment-params.model';
import { AppStore }        from '../models/app-store.model';
import { BlockParams }     from '../models/block-params.model';
import { QueryParams }     from '../models/query-params.model';
import { AppRoutes }       from '../constants/app-routes';
import { StoreActions }    from '../constants/store-actions';
import { UrlQueryParams }  from '../models/url-query-params.model';

@Injectable()
export class UrlService {
  multiQueryGenes: Observable<Array<string>>;
  searchQueryGene: Observable<any>;
  urlQueryParams: Observable<UrlQueryParams>;

  private _prev: any = {};

  constructor(private _route: ActivatedRoute,
              private _location: Location,
              private _router: Router,
              private _store: Store<AppStore>) {
    // initialize observables
    this.multiQueryGenes = this._store.select('multiQueryGenes');
    this.searchQueryGene = this._store.select('searchQueryGene');
    this.urlQueryParams  = this._store.select('urlQueryParams');
    let blockParams      = this._store.select<BlockParams>('blockParams');
    let queryParams      = this._store.select<QueryParams>('queryParams');
    let alignmentParams  = this._store.select<AlignmentParams>('alignmentParams');

    // subscribe to url query params store changes
    this.urlQueryParams.subscribe(params => {
      this._updateUrl(params);
    });

    // subscribe to url route changes (can't use ActivatedRoute.params because
    // it only gives the component added by the route the relevant segments)
    this._router.events.subscribe(route => {
      if (route instanceof RoutesRecognized) {
        let params = route.state.root.firstChild.params;
        this._routeChanged(params);
      }
    });

    // subscribe to url query param changes
    this._route.queryParams.subscribe(params => {
      this._prev = params;
      this.updateQueryParams(params);
    });

    // subscribe to param stores
    Observable.combineLatest(blockParams, queryParams, alignmentParams)
      .subscribe(paramsArray => {
        let params = Object.assign({}, ...paramsArray);
        this._updateUrl(params);
      });
  }

  private _routeChanged(params: any) {
    if (params.hasOwnProperty('genes')) {
      let genes   = params['genes'].split(','),
          action1 = {type: StoreActions.NEW_ROUTE, payload: AppRoutes.MULTI};
      this._store.dispatch(action1);
      let action2 = {type: StoreActions.NEW_MULTI_QUERY_GENES, payload: genes};
      this._store.dispatch(action2);
    } else if (params.hasOwnProperty('source') &&
               params.hasOwnProperty('gene')) {
      let gene    = {source: params['source'], gene: params['gene']},
          action1 = {type: StoreActions.NEW_ROUTE, payload: AppRoutes.SEARCH};
      this._store.dispatch(action1);
      let action2 = {type: StoreActions.NEW_SEARCH_QUERY_GENE, payload: gene};
      this._store.dispatch(action2);
    } else {
      let action = {type: StoreActions.NEW_ROUTE, payload: ''};
      this._store.dispatch(action);
    }
  }

  private _updateUrl(params: any): void {
    let extras = {queryParams: params, relativeTo: this._route};
    let url = this._router.createUrlTree([], extras).toString();
    if (Object.keys(this._prev).length == 0)
      this._location.replaceState(url);
    this._router.navigateByUrl(url);
  }

  updateQueryParams(params: any): void {
    let action = {type: StoreActions.ADD_URL_QUERY_PARAMS, payload: params};
    this._store.dispatch(action);
  }
}
