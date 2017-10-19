// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App store
import { AppStore }          from '../models/app-store.model';
import { ClusteringParams }  from '../models/clustering-params.model';
import { StoreActions }      from '../constants/store-actions';

@Injectable()
export class ClusteringService {
  clusteringParams: Observable<ClusteringParams>;

  constructor(private _store: Store<AppStore>) {
    this.clusteringParams = this._store.select('clusteringParams')
  }

  updateParams(params: ClusteringParams): void {
    if (params !== undefined)
      this._store.dispatch({type: StoreActions.ADD_CLUSTERING_PARAMS,
        payload: params});
	}
}
