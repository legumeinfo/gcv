// Angular
import { Injectable, inject } from '@angular/core';
// store
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { of } from 'rxjs';
import { catchError, map, mergeMap, takeUntil } from 'rxjs/operators';
import { createSelector, Store } from '@ngrx/store';
import * as pairwiseBlocksActions from '@gcv/gene/store/actions/pairwise-blocks.actions';
import * as fromRoot from '@gcv/store/reducers';
import { idArrayIntersection } from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as fromGenes from '@gcv/gene/store/selectors/gene/';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks/';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { PairwiseBlocksService } from '@gcv/gene/services';

const selectClearPairwiseBlocksTriggers = createSelector(
  fromGenes.getSelectedGeneIDs,
  fromParams.getBlockParams,
  fromParams.getSourceParams,
  (geneIDs, blockParams, sourceParams) =>
    [geneIDs, blockParams, sourceParams] as const,
);

@Injectable()
export class PairwiseBlocksEffects {
  private actions$ = inject(Actions);
  private pairwiseBlocksService = inject(PairwiseBlocksService);
  private _store = inject<Store<fromRoot.State>>(Store);

  // clear the store every time new query genes or parameters are emitted
  clearPairwiseBlocks$ = createEffect(() => {
    return this._store
      .select(selectClearPairwiseBlocksTriggers)
      .pipe(map(() => pairwiseBlocksActions.clear()));
  });

  // get pairwise blocks via the pairwise blocks service
  getPairwiseBlocks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(pairwiseBlocksActions.get),
      map((action) => {
        return { action: action.id, ...action.payload };
      }),
      concatLatestFrom(() => [
        this._store.select(fromPairwiseBlocks.getLoading),
        this._store.select(fromPairwiseBlocks.getLoaded),
      ]),
      mergeMap(([{ chromosome, source, params, targets, action }, loading]) => {
        const partialID = {
          referenceSource: chromosome.source,
          reference: chromosome.name,
          chromosomeSource: source,
          action,
        };
        let targetIDs =
          targets.length > 0
            ? targets.map((name) => ({ ...partialID, chromosome: name }))
            : [partialID]; // will be given wildcard name
        // only keep targets that the reducer says need to be loaded (no need to
        // check loaded since the reducer already took that into consideration)
        targetIDs = idArrayIntersection(targetIDs, loading, true);
        if (targetIDs.length == 0) {
          return [];
        }
        const filteredTargets = targetIDs
          .filter((id) => id['chromosome'] !== undefined)
          .map((id) => id['chromosome']);
        // load blocks
        return this.pairwiseBlocksService
          .getPairwiseBlocks(chromosome, params, source, filteredTargets)
          .pipe(
            takeUntil(this.actions$.pipe(ofType(pairwiseBlocksActions.CLEAR))),
            map((blocks) => {
              const payload = { chromosome, source, targets, blocks };
              return pairwiseBlocksActions.getSuccess(payload);
            }),
            catchError((error) => {
              const payload = { chromosome, source, targets };
              return of(pairwiseBlocksActions.getFailure(payload));
            }),
          );
      }),
    );
  });
}
