// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, withLatestFrom }
  from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as plotActions from '@gcv/gene/store/actions/plot.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
// app
import { Gene, Track } from '@gcv/gene/models';
import { GeneService } from '@gcv/gene/services';

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
    withLatestFrom(this.store.select(fromGene.getGeneState)),
    concatMap(([{names, source}, state]) => {
      // get loaded/loading genes
      const loadingIDs = new Set(state.loading.map(geneID));
      const loadedIDs = new Set(state.loaded.map(geneID));
      // filter out genes that are already loaded or loading
      const filteredNamess = names.filter((n) => {
          const gID = geneID(n, source);
          return !loadingIDs.has(gID) && !loadedIDs.has(gID);
        });
      // get the genes
      return this.geneService.getGenes(names, source).pipe(
        map((genes: Gene[]) =>  new geneActions.GetSuccess({genes})),
        catchError((error) => of(new geneActions.GetFailure({names, source})))
      );
    })
  );

  // get all genes for the selected micro-tracks
  @Effect()
  getMicroTrackGenes$ = this.store.select(fromMicroTracks.getAllMicroTracks).pipe(
    switchMap((tracks) => {
      return geneActions.tracksToGetGeneActions(tracks);
    }),
  );

}
