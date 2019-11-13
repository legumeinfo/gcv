// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/core/store/actions/router.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
// app
import { AlignmentParams, BlockParams, ClusteringParams, Params, QueryParams,
  SourceParams } from '@gcv/gene/models/params';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class ParamsService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  getAlignmentParams(): Observable<AlignmentParams> {
    return this._store.select(fromRouter.getMicroAlignmentParams);
  }

  getBlockParams(): Observable<BlockParams> {
    return this._store.select(fromRouter.getMacroBlockParams);
  }

  getClusteringParams(): Observable<ClusteringParams> {
    return this._store.select(fromRouter.getMicroClusteringParams);
  }

  getQueryParams(): Observable<QueryParams> {
    return this._store.select(fromRouter.getMicroQueryParams);
  }

  getSourceParams(): Observable<SourceParams> {
    return this._store.select(fromRouter.getSourceParams);
  }

  updateParams(params: Params): void {
    const path = [];
    const sources: any = {};
    if ((params as SourceParams).sources !== undefined) {
      sources['sources'] = (params as SourceParams).sources.join(',');
    }
    const query = Object.assign({}, params, sources);
    this._store.dispatch(new routerActions.Go({path, query}));
  }

}
