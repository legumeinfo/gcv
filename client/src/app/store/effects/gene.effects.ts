// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
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

  // emits a get action for each selected gene that's not loaded or loading
  @Effect()
  getSelected$ = this.store.select(fromGene.getUnloadedSelectedGeneIDs).pipe(
    filter((ids) => ids.length > 0),
    switchMap((ids) => {
      const id2action = ({name, source}) => {
          return new geneActions.Get({names: [name], source});
        };
      const actions = ids.map(id2action);
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
