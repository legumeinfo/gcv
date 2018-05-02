// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { map, mergeMap, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import * as alignedMicroTracksActions from "../actions/aligned-micro-tracks.actions";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromAlignedMicroTracks from "../reducers/aligned-micro-tracks.store";
import * as fromRouter from "../reducers/router.store";
// services
import { AlignmentService } from "../services/alignment.service";

@Injectable()
export class AlignmentEffects {

  constructor(private actions$: Actions,
              private alignmentService: AlignmentService,
              private store: Store<fromRoot.State>) { }

  // pairwise

  @Effect()
  getSearchTracks$ = this.actions$.pipe(
    ofType(microTracksActions.GET_SEARCH),
    map((action: microTracksActions.GetSearch) => action.payload),
    switchMap(({query, params, sources}) => {
      return this.alignmentService.getPairwiseReference(query).pipe(
        map((reference) => new alignedMicroTracksActions.Init({reference}))
      )
    })
  );

  @Effect()
  getSearchTracksSuccess$ = this.actions$.pipe(
    ofType(microTracksActions.GET_SEARCH_SUCCESS),
    map((action: microTracksActions.GetSearchSuccess) => action.payload.tracks),
    withLatestFrom(this.store.select(fromRouter.getMicroAlignmentParams)),
    map(([tracks, params]) => {
      return new alignedMicroTracksActions.GetPairwise({tracks, params});
    })
  );

  @Effect()
  getPairwiseAlignment$ = this.actions$.pipe(
    ofType(alignedMicroTracksActions.GET_PAIRWISE),
    map((action: alignedMicroTracksActions.GetPairwise) => action.payload),
    withLatestFrom(
      this.store.select(fromAlignedMicroTracks.getAlignmentReference)
      .filter((reference) => reference !== undefined)
    ),
    mergeMap(([{tracks, params}, reference]) => {
      const stop = this.actions$.pipe(ofType(microTracksActions.GET_SEARCH));
      return this.alignmentService.getPairwiseAlignment(reference, tracks, params).pipe(
        takeUntil(stop),
        map(tracks => new alignedMicroTracksActions.GetPairwiseSuccess({tracks})),
      );
    })
  )

  // multi

  @Effect()
  getMultipleAlignment$ = this.actions$.pipe(
    ofType(alignedMicroTracksActions.GET_MULTI),
    map((action: alignedMicroTracksActions.GetMulti) => action.payload),
    switchMap(({tracks}) => {
      return this.alignmentService.getMultipleAlignment(tracks).pipe(
        map(tracks => new alignedMicroTracksActions.GetMultiSuccess({tracks})),
      );
    })
  )
}
