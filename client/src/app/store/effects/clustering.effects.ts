// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { map, switchMap } from "rxjs/operators";
import * as fromRoot from "../reducers";
import * as clusteredMicroTracksActions from "../actions/clustered-micro-tracks.actions";
// services
import { ClusteringService } from "../../services";

@Injectable()
export class ClusteringEffects {

  constructor(private actions$: Actions,
              private clusteringService: ClusteringService,
              private store: Store<fromRoot.State>) { }

  @Effect()
  getSearchTracks$ = this.actions$.pipe(
    ofType(clusteredMicroTracksActions.GET),
    map((action: clusteredMicroTracksActions.Get) => action.payload),
    switchMap(({tracks, params}) => {
      return this.clusteringService.getClusteredMicroTracks(tracks, params).pipe(
        map((tracks) => new clusteredMicroTracksActions.GetSuccess({tracks}))
      )
    })
  );
}
