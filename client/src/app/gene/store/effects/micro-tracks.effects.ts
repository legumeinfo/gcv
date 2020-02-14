// Angular
import { Injectable } from '@angular/core';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import { partialMicroTrackID }
  from '@gcv/gene/store/reducers/micro-tracks.reducer';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, withLatestFrom }
  from 'rxjs/operators';
import * as microTracksActions
  from '@gcv/gene/store/actions/micro-tracks.actions';
// app
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { MicroTracksService } from '@gcv/gene/services';

@Injectable()
export class MicroTracksEffects {

  constructor(private actions$: Actions,
              private microTracksService: MicroTracksService,
              private store: Store<fromRoot.State>) { }

  // private

  // returns true if any of the tracks overlap with the given track
  private _tracksOverlap(track: Track, tracks: Track[]): boolean {
    const genes = new Set(track.genes);
    return tracks.some((t) => t.genes.some((g) => genes.has(g)));
  }

  // public

  // clear the store every time new parameters are emitted and search for tracks
  @Effect()
  clearTracks$ = this.store.select(fromParams.getQueryParams).pipe(
    withLatestFrom(
      this.store.select(
        fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
      this.store.select(fromParams.getSourcesParam)),
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
  consensusSearch$ = combineLatest(
      this.store.select(
        fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
      this.store.select(fromParams.getSourcesParam)
  ).pipe(
    withLatestFrom(this.store.select(fromParams.getQueryParams)),
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
  mircoTracksSearch$ = this.actions$.pipe(
    ofType(microTracksActions.SEARCH),
    map((action: microTracksActions.Search) => {
      return {action: action.id, ...action.payload};
    }),
    withLatestFrom(
      this.store.select(fromMicroTracks.getClusteredSelectedMicroTracks),
      this.store.select(fromMicroTracks.getLoading)),
    mergeMap(
    ([{cluster, families, source, params, action}, clusteredTracks, loading]) =>
    {
      //get loaded/loading tracks
      const actionSearchID = ({cluster, source, action}) => {
          return `${partialMicroTrackID(name, source)}:${action}`;
        };
      const loadingIDs = new Set(loading.map(actionSearchID));
      // only search if action is loading
      const id = actionSearchID({action, cluster, source});
      if (!loadingIDs.has(id)) {
        return [];
      }
      // search
      const clusterTracks = clusteredTracks.filter((t: ClusterMixin) => {
          return t.cluster === cluster;
        });
      const mixin = (track: Track): (Track | ClusterMixin) => {
          track.source = source;
          const t = Object.create(track);
          t.cluster = cluster;
          return t;
        };
      return this.microTracksService.microTracksSearch(families, params, source)
      .pipe(
        map((tracks) => {
          tracks = tracks.filter((t) => !this._tracksOverlap(t, clusterTracks as Track[]));
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
