// Angular
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { map, scan, tap } from "rxjs/operators";
import * as routerActions from "../actions/router.actions";

@Injectable()
export class RouterEffects {

  constructor(
    private actions$: Actions,
    private location: Location,
    private router: Router,
  ) { }

  @Effect({ dispatch: false })
  navigate$ = this.actions$.pipe(
    ofType(routerActions.GO),
    map((action: routerActions.Go) => action.payload),
    scan((currentRoute, {path, query: queryParams, extras}) => {
      const nextQueryParams = Object.assign({}, currentRoute.query, queryParams);
      return {path, query: nextQueryParams, extras};
    }, {path: [], query: {}, extras: {}}),
    tap(({path, query: queryParams, extras}) => {
      this.router.navigate(path, {
        queryParams,
        queryParamsHandling: "merge",
        ...extras,
      });
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
}
