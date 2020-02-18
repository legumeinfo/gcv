// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { combineLatest, of, zip } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, takeUntil,
  withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as pairwiseBlocksActions
  from '@gcv/gene/store/actions/pairwise-blocks.actions';
import * as fromRoot from '@gcv/store/reducers';
import { partialPairwiseBlocksID }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome/';
import * as fromGenes from '@gcv/gene/store/selectors/gene/';
import * as fromPairwiseBlocks
  from '@gcv/gene/store/selectors/pairwise-blocks/';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { PairwiseBlocksService } from '@gcv/gene/services';

@Injectable()
export class PairwiseBlocksEffects {

  constructor(private actions$: Actions,
              private pairwiseBlocksService: PairwiseBlocksService,
              private store: Store<fromRoot.State>) { }

  // clear the store every time new query genes or parameters are emitted
  @Effect()
  clearPairwiseBlocks$ = combineLatest(
    this.store.select(fromGenes.getSelectedGeneIDs),
    this.store.select(fromParams.getBlockParams),
    this.store.select(fromParams.getSourceParams),
  ).pipe(
    map((...args) => new pairwiseBlocksActions.Clear()),
  );

  // get pairwise blocks via the pairwise blocks service
  @Effect()
  getPairwiseBlocks$ = this.actions$.pipe(
    ofType(pairwiseBlocksActions.GET),
    map((action: pairwiseBlocksActions.Get) => {
      return {action: action.id, ...action.payload};
    }),
    withLatestFrom(this.store.select(fromPairwiseBlocks.getLoading)),
    mergeMap(([{chromosome, source, params, targets, action}, loading]) => {
      // get loaded/loading blocks
      const actionBlockID =
        ({action, referenceName, referenceSource, source}) => {
          const partialID =
            partialPairwiseBlocksID(referenceName, referenceSource, source);
          return `${partialID}:${action}`;
        };
      const loadingIDs = new Set(loading.map(actionBlockID));
      // only load blocks is action is loading
      const id = actionBlockID({
          referenceName: chromosome.name,
          referenceSource: chromosome.source,
          source,
          action,
        });
      if (!loadingIDs.has(id)) {
        return [];
      }
      // load blocks
      return this.pairwiseBlocksService
      .getPairwiseBlocks(chromosome, params, source, targets).pipe(
        takeUntil(this.actions$.pipe(ofType(pairwiseBlocksActions.CLEAR))),
        map((blocks) => {
          const payload = {chromosome, source, blocks};
          return new pairwiseBlocksActions.GetSuccess(payload);
        }),
        catchError((error) => {
          const payload = {chromosome, source};
          return of(new pairwiseBlocksActions.GetFailure(payload));
        })
      );
    })
  );

}
