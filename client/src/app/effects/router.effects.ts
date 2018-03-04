// Angular
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import * as routerActions from '../actions/router.actions';

@Injectable()
export class RouterEffects {
  @Effect({ dispatch: false })
  navigate$ = this.actions$.pipe(
    ofType(routerActions.GO),
    map((action: routerActions.Go) => action.payload),
    tap(({path, query: queryParams, extras}) => {
      return this.router.navigate(path, {queryParams, ...extras});
    })
  )

  @Effect({ dispatch: false })
  navigateBack$ = this.actions$.pipe(
    ofType(routerActions.BACK),
    tap(() => this.location.back())
  );

  @Effect({ dispatch: false })
  navigateForward$ = this.actions$.pipe(
    ofType(routerActions.FORWARD),
    tap(() => this.location.forward())
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private location: Location
  ) {}
}
