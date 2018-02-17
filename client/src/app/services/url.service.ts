// TODO: rehydrate store with meta-reducer and localStorage

// Angular
import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { ActivatedRoute, Router, RoutesRecognized } from "@angular/router";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";

// App store
import * as fromRoot from "../reducers";
import * as fromRouter from "../reducers/router.store";
import { AppRoutes } from "../constants/app-routes";
import { StoreActions } from "../constants/store-actions";
import { AlignmentParams } from "../models/alignment-params.model";
// import { AppStore } from "../models/app-store.model";
import { BlockParams } from "../models/block-params.model";
import { QueryParams } from "../models/query-params.model";
import { UrlQueryParams } from "../models/url-query-params.model";

@Injectable()
export class UrlService {
  multiQueryGenes: Observable<string[]>;
  searchQueryGene: Observable<any>;
  urlQueryParams: Observable<UrlQueryParams>;

  private prev: any = {};

  constructor(private route: ActivatedRoute,
              private location: Location,
              private router: Router,
              private store: Store<fromRoot.State>) {
    console.log('url service');
    this.store.select(fromRouter.getRouterState).subscribe((state) => {
      console.log(state);
    });
    // initialize observables
    // this.multiQueryGenes = this._store.select("multiQueryGenes");
    // this.searchQueryGene = this._store.select("searchQueryGene");
    // this.urlQueryParams  = this._store.select("urlQueryParams");
    // let blockParams      = this._store.select<BlockParams>("blockParams");
    // let queryParams      = this._store.select<QueryParams>("queryParams");
    // let alignmentParams  = this._store.select<AlignmentParams>("alignmentParams");
    this.multiQueryGenes = Observable.empty<string[]>();
    this.searchQueryGene = Observable.empty<any>();
    this.urlQueryParams = Observable.empty<UrlQueryParams>();
    const blockParams = Observable.empty<BlockParams>();
    const queryParams = Observable.empty<QueryParams>();
    const alignmentParams = Observable.empty<AlignmentParams>();

    // subscribe to url query params store changes
    this.urlQueryParams.subscribe((params) => {
      this._updateUrl(params);
    });

    // subscribe to url route changes (can"t use ActivatedRoute.params because
    // it only gives the component added by the route the relevant segments)
    this.router.events.subscribe((newRoute) => {
      if (newRoute instanceof RoutesRecognized) {
        const params = newRoute.state.root.firstChild.params;
        this._routeChanged(params);
      }
    });

    // subscribe to url query param changes
    this.route.queryParams.subscribe((params) => {
      this.prev = params;
      this.updateQueryParams(params);
    });

    // subscribe to param stores
    Observable.combineLatest(blockParams, queryParams, alignmentParams)
      .subscribe((paramsArray) => {
        const params = Object.assign({}, ...paramsArray);
        this._updateUrl(params);
      });
  }

  updateQueryParams(params: any): void {
    // let action = {type: StoreActions.ADD_URL_QUERY_PARAMS, payload: params};
    // this._store.dispatch(action);
  }

  private _routeChanged(params: any) {
    if (params.hasOwnProperty("genes")) {
      // let genes   = params["genes"].split(","),
      //     action1 = {type: StoreActions.NEW_ROUTE, payload: AppRoutes.MULTI};
      // this._store.dispatch(action1);
      // let action2 = {type: StoreActions.NEW_MULTI_QUERY_GENES, payload: genes};
      // this._store.dispatch(action2);
    } else if (params.hasOwnProperty("source") &&
               params.hasOwnProperty("gene")) {
      // let gene    = {source: params["source"], gene: params["gene"]},
      //     action1 = {type: StoreActions.NEW_ROUTE, payload: AppRoutes.SEARCH};
      // this._store.dispatch(action1);
      // let action2 = {type: StoreActions.NEW_SEARCH_QUERY_GENE, payload: gene};
      // this._store.dispatch(action2);
    } else {
      // let action = {type: StoreActions.NEW_ROUTE, payload: ""};
      // this._store.dispatch(action);
    }
  }

  private _updateUrl(params: any): void {
    const extras = {queryParams: params, relativeTo: this.route};
    const url = this.router.createUrlTree([], extras).toString();
    if (Object.keys(this.prev).length === 0) {
      this.location.replaceState(url);
    }
    this.router.navigateByUrl(url);
  }
}
