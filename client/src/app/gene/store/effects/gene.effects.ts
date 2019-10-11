// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, withLatestFrom }
  from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
// app
import { Gene } from '@gcv/gene/models';
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
    // TODO: will the switchMap cancel in flight requests in a federated context?
    concatMap(({names, source}) => {
      return this.geneService.getGenes(names, source).pipe(
        map((genes: Gene[]) =>  new geneActions.GetSuccess({genes})),
        catchError((error) => of(new geneActions.GetFailure({names, source})))
      );
    })
  );

  // get all genes for the selected micro-tracks
  @Effect()
  getMicroTrackGenes$ = this.store.select(fromMicroTracks.getAllMicroTracks).pipe(
    withLatestFrom(this.store.select(fromGene.getGeneState)),
    switchMap(([tracks, state]) => {
      // get loaded/loading genes
      const loadingIDs = new Set(state.loading.map(geneID));
      const loadedIDs = new Set(state.loaded.map(geneID));
      // bin genes that need to be loaded by source
      const sourceGenes = {};
      tracks.forEach((t) => {
        if (!(t.source in sourceGenes)) {
          sourceGenes[t.source] = [];
        }
        t.genes.forEach((g) => {
          const gID = geneID(g, t.source);
          if (!loadingIDs.has(gID) && !loadedIDs.has(gID)) {
            sourceGenes[t.source].push(g);
          }
        });
      });
      // convert bins to gene load actions
      const actions = [];
      Object.keys(sourceGenes).forEach((source) => {
        const genes = sourceGenes[source];
        if (genes.length !== 0) {
          const action = new geneActions.Get({names: genes, source})
          actions.push(action);
        }
      });
      return actions;
    }),
  );

}
