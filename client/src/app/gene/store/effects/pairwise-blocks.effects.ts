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
import { idArrayIntersection, pairwiseBlocksID }
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
    withLatestFrom(
      this.store.select(fromPairwiseBlocks.getLoading),
      this.store.select(fromPairwiseBlocks.getLoaded),
    ),
    mergeMap(([{chromosome, source, params, targets, action}, loading]) => {
      const partialID = {
          referenceSource: chromosome.source,
          reference: chromosome.name,
          chromosomeSource: source,
          action,
        };
      let targetIDs = (targets.length > 0) ?
        targets.map((name) => ({...partialID, chromosome: name})) :
        [partialID];  // will be given wildcard name
      // only keep targets that the reducer says need to be loaded (no need to
      // check loaded since the reducer already took that into consideration)
      targetIDs = idArrayIntersection(targetIDs, loading, true);
      if (targetIDs.length == 0) {
        return [];
      }
      let filteredTargets = targetIDs
        .filter((id) => id['chromosome'] !== undefined)
        .map((id) => id['chromosome']);
      // load blocks
      return this.pairwiseBlocksService
      .getPairwiseBlocks(chromosome, params, source, filteredTargets).pipe(
        takeUntil(this.actions$.pipe(ofType(pairwiseBlocksActions.CLEAR))),
        map((blocks) => {
          const payload = {chromosome, source, targets, blocks};
          return new pairwiseBlocksActions.GetSuccess(payload);
        }),
        catchError((error) => {
          const payload = {chromosome, source, targets};
          return of(new pairwiseBlocksActions.GetFailure(payload));
        })
      );
    })
  );

}
