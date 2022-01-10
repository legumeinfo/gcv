// Angular
import { Injectable } from '@angular/core';
// store
import { Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import { idArrayIntersection, partialMicroTrackID }
  from '@gcv/gene/store/reducers/micro-tracks.reducer';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, takeUntil, withLatestFrom }
  from 'rxjs/operators';
import * as microTracksActions
  from '@gcv/gene/store/actions/micro-tracks.actions';
// app
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { SourceParams } from '@gcv/gene/models/params';
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

  // clear the store every time a new query or change of parameters occurs
  clearTracks$ = createEffect(() => combineLatest(
    this.store.select(fromGenes.getSelectedGeneIDs),
    this.store.select(fromParams.getQueryParams),
    //this.store.select(fromParams.getSourcesParam),
    this.store.select(fromParams.getClusteringParams),
  ).pipe(
    map((...args) => new microTracksActions.Clear())
  ));

  // initializes a search whenever new aligned clusters are generated
  consensusSearch$ = createEffect(() => combineLatest(
    this.store.select(fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
    //this.store.select(fromParams.getSourcesParam)
    // TODO: This code is copied from the selector that's commented out above
    // because the selector won't compile... Fix it!
    this.store.select(fromParams.getSourceParams)
      .pipe(map((params: SourceParams): string[] => params.sources)),
    this.store.select(fromParams.getQueryParams),
  ).pipe(
    switchMap(
    ([{consensuses, tracks}, sources, params]) => {
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
  ));

  // search for similar tracks to the query
  mircoTracksSearch$ = createEffect(() => this.actions$.pipe(
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
      let targetIDs = [{cluster, source, action}];
      // only keep targets that the reducer says need to be loaded (no need to
      // check loaded since the reducer already took that into consideration)
      targetIDs = idArrayIntersection(targetIDs, loading, true);
      if (targetIDs.length == 0) {
        return [];
      }
      // search
      const clusterTracks = clusteredTracks.filter((t: ClusterMixin) => {
          return t.cluster === cluster;
        });
      const mixin = (track: Track): (Track & ClusterMixin) => {
          track.source = source;
          const t = Object.create(track);
          t.cluster = cluster;
          return t;
        };
      return this.microTracksService.microTracksSearch(families, params, source)
      .pipe(
        takeUntil(this.actions$.pipe(ofType(microTracksActions.CLEAR))),
        map((tracks) => {
          tracks = tracks.filter((t) => !this._tracksOverlap(t, clusterTracks));
          const payload = {cluster, source, tracks: tracks.map(mixin)};
          return new microTracksActions.SearchSuccess(payload);
        }),
        catchError((error) => {
          const payload = {cluster, families, source};
          return of(new microTracksActions.SearchFailure(payload));
        }),
      );
    })
  ));

}
