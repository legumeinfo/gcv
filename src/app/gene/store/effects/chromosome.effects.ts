import { concatLatestFrom } from '@ngrx/operators';// Angular
import { Injectable, inject } from '@angular/core';
// store
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as chromosomeActions from '@gcv/gene/store/actions/chromosome.actions';
import * as fromRoot from '@gcv/store/reducers';
import { idArrayIntersection } from '@gcv/gene/store/reducers/chromosome.reducer';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome/';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
// app
import { ChromosomeService } from '@gcv/gene/services';

@Injectable()
export class ChromosomeEffects {
  private actions$ = inject(Actions);
  private chromosomeService = inject(ChromosomeService);
  private _store = inject<Store<fromRoot.State>>(Store);


  // clear the store every time the set of selected genes changes
  clearChromosomes$ = createEffect(() => { return this._store.select(fromGene.getSelectedGeneIDs).pipe(
    map((...args) => new chromosomeActions.Clear()),
  ) });

  // emits a get action for each selected chromosome that's not loaded or
  // loading
  getSelected$ = createEffect(() => { return this._store
  .select(fromChromosome.getSelectedChromosomeIDs)
  .pipe(
    filter((ids) => ids.length > 0),
    mergeMap((ids): chromosomeActions.Get[] => {
      return ids.map((id) => new chromosomeActions.Get(id));
    }),
  ) });

  // get chromosome via the chromosome service
  getChromosome$ = createEffect(() => { return this.actions$.pipe(
    ofType(chromosomeActions.GET),
    map((action: chromosomeActions.Get) => {
      return {action: action.id, ...action.payload};
    }),
    concatLatestFrom(() => this._store.select(fromChromosome.getLoading)),
    mergeMap(([{action, name, source}, loading]) => {
      let targetIDs = [{name, source, action}];
      // only keep targets that the reducer says need to be loaded (no need to
      // check loaded since the reducer already took that into consideration)
      targetIDs = idArrayIntersection(targetIDs, loading, true);
      if (targetIDs.length == 0) {
        return [];
      }
      return this.chromosomeService.getChromosome(name, source).pipe(
        takeUntil(this.actions$.pipe(ofType(chromosomeActions.CLEAR))),
        map((chromosome) => new chromosomeActions.GetSuccess({chromosome})),
        catchError((e) => of(new chromosomeActions.GetFailure({name, source}))),
      );
    })
  ) });

}
