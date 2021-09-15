// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as regionActions from '@gcv/gene/store/actions/region.actions';
import * as fromRoot from '@gcv/store/reducers';
// app
import { Region } from '@gcv/gene/models';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class RegionService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  getRegion(chromosome: string, start: number, stop: number, serverID: string):
  Observable<Region> {
    const body = {chromosome, start, stop};
    return this._makeRequest<{region: Region}>(serverID, 'region', body)
      .pipe(
        map(({region}) => region),
        catchError((error) => throwError(error)));
  }

  regionSearch(chromosome: string, start: number, stop: number, source: string):
  void {
    this._store.dispatch(new regionActions.Get({chromosome, start, stop, source}));
  }

}
