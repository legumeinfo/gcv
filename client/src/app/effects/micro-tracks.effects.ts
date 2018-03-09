// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs/observable/of";
import { catchError, map, switchMap } from "rxjs/operators";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
// services
import { MicroTracksService } from "../services/micro-tracks.service";

@Injectable()
export class MicroTracksEffects {

  constructor(private actions$: Actions,
              private microTracksService: MicroTracksService) { }

  @Effect()
  getQueryTrack$ = this.actions$.pipe(
    ofType(searchQueryTrackActions.GET),
    map((action: searchQueryTrackActions.Get) => action.payload),
    switchMap(({query, neighbors}) => {
      return this.microTracksService.getQueryTrack(query.gene, neighbors, query.source).pipe(
        map(track => new searchQueryTrackActions.GetSuccess({track})),
        catchError(error => of(new searchQueryTrackActions.GetFailure(error)))
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
}
