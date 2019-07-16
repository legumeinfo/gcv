// Angular
import { Injectable } from "@angular/core";
// store
import { Action, Store } from "@ngrx/store";
import * as fromRoot from "../reducers";
import * as fromMicroTracks from "../reducers/micro-tracks.reducer";
import * as fromRouter from "../reducers/router.store";
import { Effect, Actions, ofType } from "@ngrx/effects";
import { combineLatest, of } from "rxjs";
import { catchError, map, switchMap, withLatestFrom } from "rxjs/operators";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
// app
import { Track } from "../../models";
import { ClusterMixin } from "../../models/mixins";
import { MicroTracksService } from "../../services";

@Injectable()
export class MicroTracksEffects {

  constructor(private actions$: Actions,
              private microTracksService: MicroTracksService,
              private store: Store<fromRoot.State>) { }

  // clear the store every time new parameters are emitted and search for tracks
  @Effect()
  clearTracks$ = this.store.select(fromRouter.getMicroQueryParams).pipe(
    withLatestFrom(
      this.store.select(
        fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
      this.store.select(fromRouter.getMicroQueryParamSources)),
    switchMap(([params, {consensuses, tracks}, sources]) => {
      const clear = new microTracksActions.Clear();
      const actions: microTracksActions.Actions[] = [clear];
      consensuses.forEach((families, cluster) => {
        sources.forEach((source) => {
          const payload = {cluster, families, source, params};
          const action = new microTracksActions.Search(payload);
          actions.push(action);
        });
      });
      return actions;
    }),
  );

  // initializes a search whenever new aligned clusters are generated
  // TODO: update so it only gets tracks that haven't been fetched already, e.g.
  // if a source is (de)selected
  @Effect()
  consensusSearch = combineLatest(
      this.store.select(
        fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
      this.store.select(fromRouter.getMicroQueryParamSources)
  ).pipe(
    withLatestFrom(this.store.select(fromRouter.getMicroQueryParams)),
    switchMap(([[{consensuses, tracks}, sources], params]) => {
      const actions: microTracksActions.Actions[] = [];
      consensuses.forEach((families, cluster) => {
        sources.forEach((source) => {
          const payload = {cluster, families, source, params};
          const action = new microTracksActions.Search(payload);
          actions.push(action);
        });
      });
      return actions;
    }),
  );

  // search for similar tracks to the query
  @Effect()
  miroTracksSearch$ = this.actions$.pipe(
    ofType(microTracksActions.SEARCH),
    map((action: microTracksActions.Search) => action.payload),
    switchMap(({cluster, families, source, params}) => {
      const mixin = (track: Track): (Track | ClusterMixin) => {
          track.source = source;
          const t = Object.create(track);
          t.cluster = cluster;
          return t;
        };
      return this.microTracksService.microTracksSearch(families, params, source)
      .pipe(
        map((tracks) => {
          const payload = {cluster, source, tracks: tracks.map(mixin)};
          return new microTracksActions.SearchSuccess(payload);
        }),
        catchError((error) => {
          const payload = {cluster, families, source};
          return of(new microTracksActions.SearchFailure(payload));
        }),
      );
    })
  );

}
