// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap, withLatestFrom }
  from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as chromosomeActions from "../actions/chromosome.actions";
import * as fromRoot from "../reducers";
import * as fromChromosome from "../reducers/chromosome.reducer";
// app
import { ChromosomeService } from "../../services";

@Injectable()
export class ChromosomeEffects {

  constructor(private actions$: Actions,
              private chromosomeService: ChromosomeService,
              private store: Store<fromRoot.State>) { }

  // gets chromosomes that are selected but not in the store
  /*
  @Effect()
  select2get$ = this.store.select(fromChromosome.getSelectedChromosomeIDs).pipe(
    switchMap((ids) => {
      return zip(
        ...ids.map(({name, source}) => {
          return this.store.select(
            // TODO: take loading and failed chromosomes into consideration
            fromChromosome.hasChromosome(name, source));
        })
      ).pipe(
        switchMap((hasChromosomes) => {
          const reducer = (accumulator, id, i) => {
              if (!hasChromosomes[i]) {
                const action = new chromosomeActions.Get(id);
                accumulator.push(action);
              }
              return accumulator;
            };
          const actions: chromosomeActions.Actions[] = ids.reduce(reducer, []);
          return actions;
        }),
      );
    }),
  );
  */

  // emits a get action for each selected chromosome that's not leaded or
  // loading
  @Effect()
  getSelected$ = this.store.select(fromChromosome.getSelectedChromosomeIDs).pipe(
    withLatestFrom(this.store.select(fromChromosome.getLoading),
      this.store.select(fromChromosome.getLoaded)),
    map(([ids, loading, loaded]) => {
      const id2string = (id) => `${id.name}:${id.source}`;
      const loadingIDs = new Set(loading.map(id2string));
      const loadedIDs = new Set(loaded.map(id2string));
      const actions: chromosomeActions.Actions[] = ids
        .filter((id) => {
            const idString = id2string(id);
            return loadingIDs.has(idString) && !loadedIDs.has(idString);
          })
        .map((id) => new chromosomeActions.Get(id));
      return actions;
    }),
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
