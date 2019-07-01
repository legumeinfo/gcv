// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap, withLatestFrom } from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as geneActions from "../actions/gene.actions";
import * as fromRoot from "../reducers";
import * as fromGene from "../reducers/gene.reducer";
// app
import { Gene } from "../../models";
import { GeneService } from "../../services";

@Injectable()
export class GeneEffects {

  constructor(private actions$: Actions,
              private geneService: GeneService,
              private store: Store<fromRoot.State>) { }

  /*
  @Effect()
  select2get$ = this.store.select(fromGene.getSelectedGeneIDs).pipe(
    switchMap((ids) => {
      return zip(
        ...ids.map(({name, source}) => {
          return this.store.select(fromGene.hasGene(name, source));
        })
      ).pipe(
        switchMap((hasGenes) => {
          // TODO: update so genes from the same source are batched
          const reducer = (accumulator, {name, source}, i) => {
              if (!hasGenes[i]) {
                const action = new geneActions.Get({names: [name], source});
                accumulator.push(action);
              }
              return accumulator;
            };
          const actions: geneActions.Actions[] = ids.reduce(reducer, []);
          return actions;
        }),
      );
    }),
  );
  */

  // emits a get action for each selected gene that's not loaded or loading
  @Effect()
  getSelected$ = this.store.select(fromGene.getSelectedGeneIDs).pipe(
    withLatestFrom(this.store.select(fromGene.getLoading),
      this.store.select(fromGene.getLoaded)),
    map(([ids, loading, loaded]) => {
      const id2string = (id) => `${id.name}:${id.source}`;
      const loadingIDs = new Set(loading.map(id2string));
      const loadedIDs = new Set(loaded.map(id2string));
      const actions: geneActions.Actions[] = ids
        .filter((id) => {
            const idString = id2string(id);
            return !loadingIDs.has(idString) && !loadedIDs.has(idString);
          })
        .map(({name, source}) => new geneActions.Get({names: [name], source}));
      return actions;
    }),
  );

  // TODO: when loading multi route, take loading and failed genes into
  // consideration

  // get genes via the gene service
  @Effect()
  getGenes$ = this.actions$.pipe(
    ofType(geneActions.GET),
    map((action: geneActions.Get) => action.payload),
    // TODO: will the switchMap cancel in flight requests in a federated context?
    switchMap(({names, source}) => {
      return this.geneService.getGenes(names, source).pipe(
        map((genes: Gene[]) => {
          return new geneActions.GetSuccess({genes});
        }),
        catchError((error) => of(new geneActions.GetFailure({names, source})))
      );
    })
  );

}
