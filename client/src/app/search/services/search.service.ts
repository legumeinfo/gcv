// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import * as fromSearch from '@gcv/search/store/selectors/search/';
// app
import { Result } from '@gcv/search/models';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class SearchService extends HttpService {

  constructor(private _http: HttpClient,
              private _store: Store<fromRoot.State>) {
    super(_http);
  }

  search(query: string, serverID: string): Observable<Result> {
    const body = {q: query};
    return this._makeRequest<Result>(serverID, 'search', body)
      .pipe(catchError((error) => throwError(error)));
  }

  getSearchQuery(): Observable<string> {
    return this._store.select(fromSearch.getQuery);
  }

  getSearchResultGenes(): Observable<{source: string, name: string}[]> {
    return this._store.select(fromSearch.getResultGenes);
  }

  getSearchResultRegions():
  Observable<{source: string, gene: string, neighbors: number}[]> {
    return this._store.select(fromSearch.getResultRegions);
  }

}
