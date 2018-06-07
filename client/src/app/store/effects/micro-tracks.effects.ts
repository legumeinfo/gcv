// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
// services
import { MicroTracksService } from "../../services";

@Injectable()
export class MicroTracksEffects {

  constructor(private actions$: Actions,
              private microTracksService: MicroTracksService) { }

  // search

  @Effect()
  getQueryTrack$ = this.actions$.pipe(
    ofType(searchQueryTrackActions.GET),
    map((action: searchQueryTrackActions.Get) => action.payload),
    switchMap(({query, neighbors}) => {
      const source = query.source;
      return this.microTracksService.getQueryTrack(query.gene, neighbors, source).pipe(
        map((track) => new searchQueryTrackActions.GetSuccess({track})),
        catchError((error) => of(new searchQueryTrackActions.GetFailure(error)))
      );
    })
  );

  @Effect()
  getSearchTracks$ = this.actions$.pipe(
    ofType(microTracksActions.GET_SEARCH),
    map((action: microTracksActions.GetSearch) => action.payload),
    switchMap(({query, params, sources}) => {
      return this.microTracksService.getFederatedSearchTracks(query, params, sources).pipe(
        map(([source, tracks]) => new microTracksActions.GetSearchSuccess({tracks, source})),
        catchError(([source, error]) => of(new microTracksActions.GetSearchFailure({error, source})))
      )
    })
  );

  // multi

  @Effect()
  getMultiTracks$ = this.actions$.pipe(
    ofType(microTracksActions.GET_MULTI),
    map((action: microTracksActions.GetMulti) => action.payload),
    switchMap(({query, neighbors, sources}) => {
      return this.microTracksService.getFederatedMultiTracks(query, neighbors, sources).pipe(
        map(([source, tracks]) => new microTracksActions.GetMultiSuccess({tracks, source})),
        catchError(([source, error]) => of(new microTracksActions.GetMultiFailure({error, source})))
      )
    })
  );
}
