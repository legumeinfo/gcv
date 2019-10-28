// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// store
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromPlots from '@gcv/gene/store/selectors/plots';
// app
import { Plot, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class PlotsService extends HttpService {

  constructor(private _http: HttpClient, private store: Store<fromRoot.State>) {
    super(_http);
  }

  getLocalPlots(track: (Track | ClusterMixin)): Observable<Plot[]> {
    return this.store.pipe(select(fromPlots.getLocalPlots(track)));
  }

  //getGlobalPlot(track: (Track | ClusterMixin)): Observable<Plot[]> {
  //  return this.store.pipe(select(fromPlots.getGlobalPlots(track)));
  //}

}
