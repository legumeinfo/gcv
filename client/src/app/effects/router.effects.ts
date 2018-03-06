// Angular
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { map, tap } from "rxjs/operators";
import * as routerActions from "../actions/router.actions";

@Injectable()
export class RouterEffects {

  // TODO: update navigate effect so it doesn't rely on this variable
  private queryParams: any = {};

  constructor(
    private actions$: Actions,
    private location: Location,
    private router: Router,
  ) { }

  @Effect({ dispatch: false })
  navigate$ = this.actions$.pipe(
    ofType(routerActions.GO),
    map((action: routerActions.Go) => action.payload),
    tap(({path, query: queryParams, extras}) => {
      Object.assign(this.queryParams, queryParams);
      this.router.navigate(path, {
        queryParams: this.queryParams,
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
