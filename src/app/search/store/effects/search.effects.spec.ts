import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

import { SearchEffects } from './search.effects';
import { SearchService } from '@gcv/search/services';
import * as searchActions from '@gcv/search/store/actions/search.actions';
import * as fromSearch from '@gcv/search/store/selectors/search/';
import * as fromParams from '@gcv/search/store/selectors/params';

// SearchEffects wires the search pipeline: it clears results when the query
// changes, fans a query out into one Search per configured source, and turns
// each Search into a SearchSuccess/SearchFailure via the SearchService. The
// state-driven effects read the query/params/loading selectors (directly or via
// a composed selector), so we drive those leaf selectors with MockStore — the
// same streams router-store drives out of the Angular zone under Angular 22 +
// NgRx 21 (see the NgZone test at the bottom).

describe('SearchEffects', () => {
  let actions$: ReplaySubject<any>;
  let effects: SearchEffects;
  let searchService: { search: jest.Mock };
  let store: MockStore;

  const setLoading = (value: unknown[]) => {
    store.overrideSelector(fromSearch.getLoading, value);
    store.refreshState();
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<any>(1);
    searchService = { search: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        SearchEffects,
        provideMockActions(() => actions$),
        { provide: SearchService, useValue: searchService },
        provideMockStore(),
      ],
    });

    store = TestBed.inject(MockStore);
    store.overrideSelector(fromSearch.getQuery, 'Glyma.09G134900');
    store.overrideSelector(fromParams.getSourceParams, { sources: ['lis'] });
    store.overrideSelector(fromSearch.getLoading, []);
    store.refreshState();

    effects = TestBed.inject(SearchEffects);
  });

  it('clearResults dispatches CLEAR whenever the query changes', (done) => {
    effects.clearResults.pipe(take(1)).subscribe((action) => {
      expect(action.type).toBe(searchActions.CLEAR);
      done();
    });
  });

  it('initializeSearch$ dispatches one Search per configured source', (done) => {
    store.overrideSelector(fromParams.getSourceParams, {
      sources: ['lis', 'other'],
    });
    store.refreshState();

    effects.initializeSearch$
      .pipe(take(2), toArray())
      .subscribe((actions: any[]) => {
        expect(actions.map((a) => a.type)).toEqual([
          searchActions.SEARCH,
          searchActions.SEARCH,
        ]);
        expect(actions.map((a) => a.payload.source)).toEqual(['lis', 'other']);
        expect(
          actions.every((a) => a.payload.query === 'Glyma.09G134900'),
        ).toBe(true);
        done();
      });
  });

  it('search$ emits SearchSuccess with the service result on success', (done) => {
    const result = { tracks: [] } as any;
    searchService.search.mockReturnValue(of(result));
    const search = searchActions.search({
      query: 'Glyma.09G134900',
      source: 'lis',
    });
    // the reducer marks this {source, action-id} pair as loading
    setLoading([{ source: 'lis', action: search.id }]);

    effects.search$.pipe(take(1)).subscribe((action: any) => {
      expect(action.type).toBe(searchActions.SEARCH_SUCCESS);
      expect(action.payload).toEqual({ source: 'lis', result });
      expect(searchService.search).toHaveBeenCalledWith(
        'Glyma.09G134900',
        'lis',
      );
      done();
    });

    actions$.next(search);
  });

  it('search$ emits SearchFailure when the service errors', (done) => {
    searchService.search.mockReturnValue(throwError(() => new Error('boom')));
    const search = searchActions.search({
      query: 'Glyma.09G134900',
      source: 'lis',
    });
    setLoading([{ source: 'lis', action: search.id }]);

    effects.search$.pipe(take(1)).subscribe((action: any) => {
      expect(action.type).toBe(searchActions.SEARCH_FAILURE);
      expect(action.payload).toEqual({ source: 'lis' });
      done();
    });

    actions$.next(search);
  });

  it('search$ skips sources the reducer has not marked as loading', () => {
    searchService.search.mockReturnValue(of({} as any));
    setLoading([]); // nothing pending → the search is a no-op

    let emitted = false;
    effects.search$.subscribe(() => (emitted = true));
    actions$.next(
      searchActions.search({ query: 'Glyma.09G134900', source: 'lis' }),
    );

    expect(emitted).toBe(false);
    expect(searchService.search).not.toHaveBeenCalled();
  });

  // Regression guard for the Angular 22 upgrade: router-store emits navigation
  // (and therefore the getQuery selector) OUTSIDE the Angular zone, so the
  // clearResults effect dispatches CLEAR out-of-zone. This is why
  // strictActionWithinNgZone is disabled in app.module.ts — assert the effect
  // keeps working when its source emits outside the zone.
  it('clearResults dispatches CLEAR even when the query emits outside the Angular zone', () => {
    const zone = TestBed.inject(NgZone);
    const seen: { type: string; inZone: boolean }[] = [];

    const sub = effects.clearResults.subscribe((a: any) =>
      seen.push({ type: a.type, inZone: NgZone.isInAngularZone() }),
    );
    seen.length = 0; // drop the initial (in-zone) emission

    zone.runOutsideAngular(() => {
      store.overrideSelector(fromSearch.getQuery, 'a-new-query');
      store.refreshState();
    });
    sub.unsubscribe();

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((s) => s.type === searchActions.CLEAR)).toBe(true);
    expect(seen.some((s) => s.inZone === false)).toBe(true);
  });
});
