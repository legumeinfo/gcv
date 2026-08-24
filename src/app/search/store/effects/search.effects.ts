import { concatLatestFrom } from '@ngrx/operators'; // Angular
import { Injectable, inject } from '@angular/core';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import { idArrayIntersection } from '@gcv/search/store/reducers/search.reducer';
import * as fromSearch from '@gcv/search/store/selectors/search/';
import * as fromParams from '@gcv/search/store/selectors/params';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import {
  catchError,
  map,
  mergeMap,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import * as searchActions from '@gcv/search/store/actions/search.actions';
// app
import { SearchService } from '@gcv/search/services';

@Injectable()
export class SearchEffects {
  private actions$ = inject(Actions);
  private searchService = inject(SearchService);
  private _store = inject<Store<fromRoot.State>>(Store);

  // public

  // clear the store every time a new query occurs
  clearResults = createEffect(() => {
    return this._store
      .select(fromSearch.getQuery)
      .pipe(map((...args) => searchActions.clear()));
  });

  // initializes a search whenever new aligned clusters are generated
  initializeSearch$ = createEffect(() => {
    return combineLatest(
      this._store.select(fromSearch.getQuery),
      this._store.select(fromParams.getSourceParams),
    ).pipe(
      switchMap(([query, { sources }]) => {
        const actions: searchActions.Actions[] = [];
        sources.forEach((source) => {
          const payload = { query, source };
          const action = searchActions.search(payload);
          actions.push(action);
        });
        return actions;
      }),
    );
  });

  // perform the search
  search$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(searchActions.search),
      map((action) => {
        return { action: action.id, ...action.payload };
      }),
      concatLatestFrom(() => this._store.select(fromSearch.getLoading)),
      mergeMap(([{ query, source, action }, loading]) => {
        let targetIDs = [{ source, action }];
        // only keep targets that the reducer says need to be loaded (no need to
        // check loaded since the reducer already took that into consideration)
        targetIDs = idArrayIntersection(targetIDs, loading, true);
        if (targetIDs.length == 0) {
          return [];
        }
        // search
        return this.searchService.search(query, source).pipe(
          takeUntil(this.actions$.pipe(ofType(searchActions.CLEAR))),
          map((result) => {
            const payload = { source, result };
            return searchActions.searchSuccess(payload);
          }),
          catchError((error) => {
            const payload = { source };
            return of(searchActions.searchFailure(payload));
          }),
        );
      }),
    );
  });
}
