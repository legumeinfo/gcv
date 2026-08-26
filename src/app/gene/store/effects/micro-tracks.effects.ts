// Angular
import { Injectable, inject } from '@angular/core';
// store
import { createSelector, Store } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import { idArrayIntersection } from '@gcv/gene/store/reducers/micro-tracks.reducer';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
import * as fromParams from '@gcv/gene/store/selectors/params';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { of } from 'rxjs';
import {
  catchError,
  map,
  mergeMap,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import * as microTracksActions from '@gcv/gene/store/actions/micro-tracks.actions';
// app
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { MicroTracksService } from '@gcv/gene/services';

const selectClearTracksTriggers = createSelector(
  fromGenes.getSelectedGeneIDs,
  fromParams.getQueryParams,
  fromParams.getClusteringParams,
  (geneIDs, queryParams, clusteringParams) =>
    [geneIDs, queryParams, clusteringParams] as const,
);

const selectConsensusSearchInputs = createSelector(
  fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks,
  fromParams.getSourceParams,
  fromParams.getQueryParams,
  (aligned, sourceParams, queryParams) =>
    [aligned, sourceParams.sources, queryParams] as const,
);

@Injectable()
export class MicroTracksEffects {
  private actions$ = inject(Actions);
  private microTracksService = inject(MicroTracksService);
  private _store = inject<Store<fromRoot.State>>(Store);

  // private

  // returns true if any of the tracks overlap with the given track
  private _tracksOverlap(track: Track, tracks: Track[]): boolean {
    const genes = new Set(track.genes);
    return tracks.some((t) => t.genes.some((g) => genes.has(g)));
  }

  // public

  // clear the store every time a new query or change of parameters occurs
  clearTracks$ = createEffect(() => {
    return this._store
      .select(selectClearTracksTriggers)
      .pipe(map(() => microTracksActions.clear()));
  });

  // initializes a search whenever new aligned clusters are generated
  consensusSearch$ = createEffect(() => {
    return this._store.select(selectConsensusSearchInputs).pipe(
      switchMap(([{ consensuses, tracks }, sources, params]) => {
        const actions: microTracksActions.Actions[] = [];
        consensuses.forEach((families, cluster) => {
          sources.forEach((source) => {
            const payload = { cluster, families, source, params };
            const action = microTracksActions.search(payload);
            actions.push(action);
          });
        });
        return actions;
      }),
    );
  });

  // search for similar tracks to the query
  mircoTracksSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(microTracksActions.search),
      map((action) => {
        return { action: action.id, ...action.payload };
      }),
      concatLatestFrom(() => [
        this._store.select(fromMicroTracks.getClusteredSelectedMicroTracks),
        this._store.select(fromMicroTracks.getLoading),
      ]),
      mergeMap(
        ([
          { cluster, families, source, params, action },
          clusteredTracks,
          loading,
        ]) => {
          let targetIDs = [{ cluster, source, action }];
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
          const mixin = (track: Track): Track & ClusterMixin => {
            track.source = source;
            const t = Object.create(track);
            t.cluster = cluster;
            return t;
          };
          return this.microTracksService
            .microTracksSearch(families, params, source)
            .pipe(
              takeUntil(this.actions$.pipe(ofType(microTracksActions.CLEAR))),
              map((tracks) => {
                tracks = tracks.filter(
                  (t) => !this._tracksOverlap(t, clusterTracks),
                );
                const payload = { cluster, source, tracks: tracks.map(mixin) };
                return microTracksActions.searchSuccess(payload);
              }),
              catchError((error) => {
                const payload = { cluster, families, source };
                return of(microTracksActions.searchFailure(payload));
              }),
            );
        },
      ),
    );
  });
}
