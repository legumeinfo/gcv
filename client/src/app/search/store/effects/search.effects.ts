// Angular
import { Injectable } from '@angular/core';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import { idArrayIntersection } from '@gcv/search/store/reducers/search.reducer';
import * as fromSearch from '@gcv/search/store/selectors/search/';
import * as fromParams from '@gcv/search/store/selectors/params';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, takeUntil, withLatestFrom }
  from 'rxjs/operators';
import * as searchActions
  from '@gcv/search/store/actions/search.actions';
// app
import { Result } from '@gcv/search/models';
import { SearchService } from '@gcv/search/services';


@Injectable()
export class SearchEffects {

  constructor(private actions$: Actions,
              private searchService: SearchService,
              private store: Store<fromRoot.State>) { }

  // public

  // clear the store every time a new query occurs
  @Effect()
  clearResults = this.store.select(fromSearch.getQuery)
  .pipe(
    map((...args) => new searchActions.Clear())
  );

  // initializes a search whenever new aligned clusters are generated
  @Effect()
  initializeSearch$ = combineLatest(
    this.store.select(fromSearch.getQuery),
    this.store.select(fromParams.getSourceParams)
  ).pipe(
    switchMap(
    ([query, {sources}]) => {
      const actions: searchActions.Actions[] = [];
      sources.forEach((source) => {
        const payload = {query, source};
        const action = new searchActions.Search(payload);
        actions.push(action);
      });
      return actions;
    }),
  );

  // perform the search
  @Effect()
  search$ = this.actions$.pipe(
    ofType(searchActions.SEARCH),
    map((action: searchActions.Search) => {
      return {action: action.id, ...action.payload};
    }),
    withLatestFrom(
      this.store.select(fromSearch.getLoading)),
    mergeMap(
    ([{query, source, action}, loading]) =>
    {
      let targetIDs = [{source, action}];
      // only keep targets that the reducer says need to be loaded (no need to
      // check loaded since the reducer already took that into consideration)
      targetIDs = idArrayIntersection(targetIDs, loading, true);
      if (targetIDs.length == 0) {
        return [];
      }
      // search
      return this.searchService.search(query, source)
      .pipe(
        takeUntil(this.actions$.pipe(ofType(searchActions.CLEAR))),
        map((result) => {
          const payload = {source, result};
          return new searchActions.SearchSuccess(payload);
        }),
        catchError((error) => {
          const payload = {source};
          return of(new searchActions.SearchFailure(payload));
        }),
      );
    })
  );

}
