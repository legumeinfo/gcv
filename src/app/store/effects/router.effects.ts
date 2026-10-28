// Angular
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
// store
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import * as routerActions from '@gcv/store/actions/router.actions';

@Injectable()
export class RouterEffects {
  private actions$ = inject(Actions);
  private location = inject(Location);
  private router = inject(Router);

  // Changes the URL's query parameters, keeping the others. It builds on the
  // navigation under way, if any, which hasn't reached the URL yet, so quick
  // successive changes all apply; otherwise on the URL itself, so a change
  // keeps what Back and Forward restored. A null parameter is removed.
  navigate$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(routerActions.go),
        map((action) => action.payload),
        tap(({ path, query, extras }) => {
          const navigation = this.router.currentNavigation();
          const base =
            navigation?.finalUrl ??
            navigation?.extractedUrl ??
            this.router.parseUrl(this.router.url);
          this.router.navigate(path, {
            queryParams: { ...base.queryParams, ...query },
            ...extras,
          });
        }),
      );
    },
    { dispatch: false },
  );

  navigateBack$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(routerActions.BACK),
        tap(() => this.location.back()),
      );
    },
    { dispatch: false },
  );

  navigateForward$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(routerActions.FORWARD),
        tap(() => this.location.forward()),
      );
    },
    { dispatch: false },
  );
}
