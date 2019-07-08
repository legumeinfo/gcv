// Angular
import { Injectable } from "@angular/core";
// store
import { Store } from "@ngrx/store";
import * as fromRoot from "../reducers";
import * as fromMicroTracks from "../reducers/micro-tracks.reducer";
import * as fromRouter from "../reducers/router.store";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { combineLatest, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
// services
import { MicroTracksService } from "../../services";

@Injectable()
export class MicroTracksEffects {

  constructor(private actions$: Actions,
              private microTracksService: MicroTracksService,
              private store: Store<fromRoot.State>) { }

  // gets the selected chromosomes and converts them into micro-tracks
  //@Effect()
  //getSimilarTracks$ = combineLatest(
  //    this.store.select(fromMicroTracks.getSelected),
  //    this.store.select(fromRouter.getMicroQueryParamNeighbors)).pipe(
  //  //switchMap(([tracks, neighbors]) => {
  //  //  const source = query.source;
  //  //  return this.microTracksService.getQueryTrack(query.gene, neighbors, source).pipe(
  //  //    map((track) => new searchQueryTrackActions.GetSuccess({track})),
  //  //    catchError((error) => of(new searchQueryTrackActions.GetFailure(error)))
  //  //  );
  //  //})
  //);

  //@Effect()
  //getMiroTracks$ = this.actions$.pipe(
  //  ofType(microTracksActions.SEARCH),
  //  map((action: microTracksActions.Search) => action.payload),
  //  switchMap(({families, source}) => {
  //    return this.microTracksService.searchForMicroTracks();
  //  })
  //);

}
