// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromParams from '@gcv/gene/store/selectors/params/';
// app
import { AlignmentParams, BlockParams, ClusteringParams, MacroFilterParams,
  MacroOrderParams, MicroFilterParams, MicroOrderParams, Params, QueryParams,
  SourceParams } from '@gcv/gene/models/params';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class ParamsService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  getAlignmentParams(): Observable<AlignmentParams> {
    return this._store.select(fromParams.getAlignmentParams);
  }

  getBlockParams(): Observable<BlockParams> {
    return this._store.select(fromParams.getBlockParams);
  }

  getClusteringParams(): Observable<ClusteringParams> {
    return this._store.select(fromParams.getClusteringParams);
  }

  getMacroFilterParams(): Observable<MacroFilterParams> {
    return this._store.select(fromParams.getMacroFilterParams);
  }

  getMacroOrderParams(): Observable<MacroOrderParams> {
    return this._store.select(fromParams.getMacroOrderParams);
  }

  getMicroFilterParams(): Observable<MicroFilterParams> {
    return this._store.select(fromParams.getMicroFilterParams);
  }

  getMicroOrderParams(): Observable<MicroOrderParams> {
    return this._store.select(fromParams.getMicroOrderParams);
  }

  getQueryParams(): Observable<QueryParams> {
    return this._store.select(fromParams.getQueryParams);
  }

  getSourceParams(): Observable<SourceParams> {
    return this._store.select(fromParams.getSourceParams);
  }

  updateParams(params: Params): void {
    const path = [];
    const sources: any = {};
    if (params['sources'] !== undefined) {
      sources['sources'] = params['sources'].join(',');
    }
    const query = Object.assign({}, params, sources);
    this._store.dispatch(new routerActions.Go({path, query}));
  }

}
