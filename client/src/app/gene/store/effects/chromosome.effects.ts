// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, takeUntil,
  withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as chromosomeActions from '@gcv/gene/store/actions/chromosome.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome/';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
import { TrackID, trackID } from '@gcv/gene/store/utils';
// app
import { ChromosomeService } from '@gcv/gene/services';

@Injectable()
export class ChromosomeEffects {

  constructor(private actions$: Actions,
              private chromosomeService: ChromosomeService,
              private store: Store<fromRoot.State>) { }

  // clear the store every time the set of selected genes changes
  @Effect()
  clearChromosomes$ = this.store.select(fromGene.getSelectedGeneIDs).pipe(
    map((...args) => new chromosomeActions.Clear()),
  );

  // emits a get action for each selected chromosome that's not loaded or
  // loading
  @Effect()
  getSelected$ = this.store
  .select(fromChromosome.getUnloadedSelectedChromosomeIDs).pipe(
    filter((ids) => ids.length > 0),
    mergeMap((ids) => ids.map((id) => new chromosomeActions.Get(id))),
  );

  // get chromosome via the chromosome service
  @Effect()
  getChromosome$ = this.actions$.pipe(
    ofType(chromosomeActions.GET),
    map((action: chromosomeActions.Get) => {
      return {action: action.id, ...action.payload};
    }),
    withLatestFrom(this.store.select(fromChromosome.getLoading)),
    mergeMap(([{action, name, source}, loading]) => {
      // get loaded/loading genes
      const actionTrackID =
        ({name, source, action}) => `${trackID(name, source)}:${action}`;
      const loadingIDs = new Set(loading.map(actionTrackID));
      // only load chromosome if action is loading
      const id = actionTrackID({action, name, source});
      if (!loadingIDs.has(id)) {
        return [];
      }
      return this.chromosomeService.getChromosome(name, source).pipe(
        takeUntil(this.actions$.pipe(ofType(chromosomeActions.CLEAR))),
        map((chromosome) => {
          return new chromosomeActions.GetSuccess({chromosome});
        }),
        catchError((error) => of(new chromosomeActions.GetFailure(error)))
      );
    })
  );

}
