// Angular
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import * as fromPlots from '@gcv/gene/store/selectors/plots';
// app
import { Plot, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';

@Injectable()
export class PlotsService {
  private _store = inject<Store<fromRoot.State>>(Store);

  getLocalPlots(track: Track & ClusterMixin): Observable<Plot[]> {
    return this._store.select(fromPlots.getLocalPlots(track));
  }

  getGlobalPlots(track: Track & ClusterMixin): Observable<Plot[]> {
    return this._store.select(fromPlots.getGlobalPlots(track));
  }
}
