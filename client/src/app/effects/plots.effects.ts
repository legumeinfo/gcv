// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { of } from "rxjs/observable/of";
import { catchError, map, mergeMap, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import * as globalPlotsActions from "../actions/global-plots.actions";
import * as localPlotsActions from "../actions/local-plots.actions";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromGlobalPlots from "../reducers/global-plots.store";
import * as fromLocalPlots from "../reducers/local-plots.store";
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
    withLatestFrom(this.store.select(fromSearchQueryTrack.getSearchQueryTrack)),
    switchMap(([{query, params, sources}, reference]) => {
      return [
        new localPlotsActions.Init(),
        new localPlotsActions.Get({reference, tracks: [reference]}),
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

  @Effect()
  getOrSelectGlobalPlot$ = this.actions$.pipe(
    ofType(globalPlotsActions.GET_OR_SELECT),
    map((action: globalPlotsActions.Select) => action.payload),
    switchMap(({id}) => {
      return this.store.select(fromGlobalPlots.hasPlot(id)).take(1).pipe(
        withLatestFrom(
          this.store.select(fromSearchQueryTrack.getSearchQueryTrack),
          this.store.select(fromLocalPlots.getPlotByID(id)),
        ),
        switchMap(([hasPlot, reference, local]) => {
          const actions: globalPlotsActions.Actions[] = [
            new globalPlotsActions.Select({id})
          ];
          if (!hasPlot) {
            actions.push(new globalPlotsActions.Get({reference, local}));
          }
          return actions;
        }),
      );
    }),
  )

  @Effect()
  getGlobalPlot$ = this.actions$.pipe(
    ofType(globalPlotsActions.GET),
    map((action: globalPlotsActions.Get) => action.payload),
    switchMap(({reference, local}) => {
      const stop = this.actions$.pipe(ofType(microTracksActions.GET_SEARCH));
      const source = local.source;
      return this.plotsService.getGlobalFromLocal(reference, local).pipe(
        takeUntil(stop),
        map((plot) => new globalPlotsActions.GetSuccess({plot, source})),
        catchError((error) => of(new globalPlotsActions.GetFailure(error))),
      );
    })
  )
}
