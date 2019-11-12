// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/core/store/actions/router.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
// app
import { QueryParams, SourceParams } from '@gcv/gene/models';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class ParamsService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  updateQueryParams(params: QueryParams): void {
    const path = [];
    const query = Object.assign({}, params);
    this._store.dispatch(new routerActions.Go({path, query}));
  }

  updateSourceParams(params: SourceParams): void {
    const path = [];
    const query = Object.assign({}, params, {sources: params.sources.join(',')});
    this._store.dispatch(new routerActions.Go({path, query}));
  }
}
