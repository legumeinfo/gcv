// Angular
import { Injectable }    from '@angular/core';
import { Store }         from '@ngrx/store';
import { Observable }    from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// App store
import { AppStore }       from '../models/app-store.model';
import { UrlQueryParams } from '../models/url-query-params.model';

@Injectable()
export class UrlQueryParamsService {
  params: Observable<UrlQueryParams>;

  constructor(private store: Store<AppStore>) {
    this.init();
  }

  init(): void {
    // Bind an observable of our params to "UrlQueryParamsService"
    this.params = this.store.select('url-query-params');

  }

  // params = QueryParams || AlignmentParams || {order: OrderAlgorithm.id}
  updateParams(params: any): void {
    this.store.dispatch({type: 'ADD_QUERY_PARAMS', payload: params});
	}
}
