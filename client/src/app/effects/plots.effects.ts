// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { map, mergeMap, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import * as globalPlotsActions from "../actions/global-plots.actions";
import * as localPlotsActions from "../actions/local-plots.actions";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromRouter from "../reducers/router.store";
import * as fromSearchQueryTrack from "../reducers/search-query-track.store";
// services
import { PlotsService } from "../services/plots.service";

@Injectable()
export class PlotsEffects {

  constructor(private actions$: Actions,
              private plotsService: PlotsService,
              private store: Store<fromRoot.State>) { }

  // local

  @Effect()
  getSearchTracks$ = this.actions$.pipe(
    ofType(microTracksActions.GET_SEARCH),
    map((action: microTracksActions.GetSearch) => action.payload),
    switchMap(({query, params, sources}) => {
      return [
        new localPlotsActions.Init(),
        new globalPlotsActions.Init(),
      ];
    }),
  );

  @Effect()
  getSearchTracksSuccess$ = this.actions$.pipe(
    ofType(microTracksActions.GET_SEARCH_SUCCESS),
    map((action: microTracksActions.GetSearchSuccess) => action.payload.tracks),
    withLatestFrom(this.store.select(fromSearchQueryTrack.getSearchQueryTrack)),
    map(([microTracks, reference]) => {
      const tracks = microTracks.groups;
      return new localPlotsActions.Get({reference, tracks});
    })
  );

  @Effect()
  getLocalPlots$ = this.actions$.pipe(
    ofType(localPlotsActions.GET),
    map((action: localPlotsActions.Get) => action.payload),
    mergeMap(({reference, tracks}) => {
      const stop = this.actions$.pipe(ofType(microTracksActions.GET_SEARCH));
      return this.plotsService.getPlots(reference, tracks).pipe(
        takeUntil(stop),
        map(plots =>  new localPlotsActions.GetSuccess({plots})),
      );
    })
  )

  // global

  //@Effect()
  //getMultipleAlignment$ = this.actions$.pipe(
  //  ofType(alignedMicroTracksActions.GET_MULTI),
  //  map((action: alignedMicroTracksActions.GetMulti) => action.payload),
  //  switchMap(({tracks}) => {
  //    return this.alignmentService.getMultipleAlignment(tracks).pipe(
  //      map(tracks => new alignedMicroTracksActions.GetMultiSuccess({tracks})),
  //    );
  //  })
  //)
}
