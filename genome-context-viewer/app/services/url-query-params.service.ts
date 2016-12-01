// Angular
import { ActivatedRoute } from '@angular/router';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Router }         from '@angular/router';
import { Store }          from '@ngrx/store';
import 'rxjs/add/operator/map';

// App store
import { AppStore }       from '../models/app-store.model';
import { UrlQueryParams } from '../models/url-query-params.model';

@Injectable()
export class UrlQueryParamsService {
  params: Observable<UrlQueryParams>;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private store: Store<AppStore>) {
    this.init();
  }

  init(): void {
    this.params = this.store.select('url-query-params');
    this.route.queryParams.subscribe(this.updateStore);
  }

  private updateUrl(params: any): void {
    this.router.navigate([], {queryParams: Object.assign(this.params, params)});
  }

  private updateStore(params: any): void {
    this.store.dispatch({type: 'ADD_QUERY_PARAMS', payload: params});
  }

  // params = QueryParams || AlignmentParams || {order: OrderAlgorithm.id}
  updateParams(params: any): void {
    this.updateUrl(params);
    this.updateStore(params);
	}
}
