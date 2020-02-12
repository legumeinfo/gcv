// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { combineLatest, of, zip } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom }
  from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as pairwiseBlocksActions from '@gcv/gene/store/actions/pairwise-blocks.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome/';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks/';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { PairwiseBlocksService } from '@gcv/gene/services';

@Injectable()
export class PairwiseBlocksEffects {

  constructor(private actions$: Actions,
              private pairwiseBlocksService: PairwiseBlocksService,
              private store: Store<fromRoot.State>) { }

  // clear the store every time new parameters are emitted and get new blocks
  @Effect()
  clearBlocks$ = this.store.select(fromParams.getBlockParams).pipe(
    withLatestFrom(
      this.store.select(fromChromosome.getSelectedChromosomes),
      this.store.select(fromParams.getSourcesParam)),
    switchMap(([params, chromosomes, sources]) => {
      const clear = new pairwiseBlocksActions.Clear();
      const actions: pairwiseBlocksActions.Actions[] = [clear];
      return actions;
    }),
  );

  // get pairwise blocks via the pairwise blocks service
  @Effect()
  getPairwiseBlocks$ = this.actions$.pipe(
    ofType(pairwiseBlocksActions.GET),
    map((action: pairwiseBlocksActions.Get) => action.payload),
    mergeMap(({chromosome, source, params, targets}) => {
      return this.pairwiseBlocksService
      .getPairwiseBlocks(chromosome, params, source, targets).pipe(
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
