// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap }
  from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as chromosomeActions from '@gcv/gene/store/actions/chromosome.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome/';
// app
import { ChromosomeService } from '@gcv/gene/services';

@Injectable()
export class ChromosomeEffects {

  constructor(private actions$: Actions,
              private chromosomeService: ChromosomeService,
              private store: Store<fromRoot.State>) { }

  // emits a get action for each selected chromosome that's not loaded or
  // loading
  @Effect()
  getSelected$ = this.store
  .select(fromChromosome.getUnloadedSelectedChromosomeIDs).pipe(
    filter((ids) => ids.length > 0),
    switchMap((ids) =>  ids.map((id) => new chromosomeActions.Get(id))),
  );

  // get chromosome via the chromosome service
  @Effect()
  getChromosome$ = this.actions$.pipe(
    ofType(chromosomeActions.GET),
    map((action: chromosomeActions.Get) => action.payload),
    // TODO: is the switchMap going to cancel in flight requests we want to keep?
    switchMap(({name, source}) => {
      return this.chromosomeService.getChromosome(name, source).pipe(
        map((chromosome) => {
          return new chromosomeActions.GetSuccess({chromosome});
        }),
        catchError((error) => of(new chromosomeActions.GetFailure(error)))
      );
    })
  );

}
