// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App store
import { ADD_CLUSTERING_PARAMS } from '../constants/actions';
import { ClusteringParams }      from '../models/clustering-params.model';
import { AppStore }              from '../models/app-store.model';

@Injectable()
export class ClusteringService {
  clusteringParams: Observable<ClusteringParams>;

  constructor(private _store: Store<AppStore>) {
    this.clusteringParams = this._store.select('clusteringParams')
  }

  updateParams(params: ClusteringParams): void {
    this._store.dispatch({type: ADD_CLUSTERING_PARAMS, payload: params});
	}
}
