// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// store
import { Store, select } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import * as fromPlots from '@gcv/gene/store/selectors/plots';
// app
import { Plot, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


@Injectable()
export class PlotsService {

  constructor(private _store: Store<fromRoot.State>) { }

  getLocalPlots(track: (Track & ClusterMixin)): Observable<Plot[]> {
    return this._store.pipe(select(fromPlots.getLocalPlots(track)));
  }

  getGlobalPlots(track: (Track & ClusterMixin)): Observable<Plot[]> {
    return this._store.pipe(select(fromPlots.getGlobalPlots(track)));
  }

}
