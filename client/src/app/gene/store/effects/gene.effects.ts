// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, withLatestFrom }
  from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as fromRoot from '@gcv/store/reducers';
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
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
      // bin ids by source
      const reducer = (accumulator, {name, source}) => {
          if (!(source in accumulator)) {
            accumulator[source] = [];
          }
          accumulator[source].push(name);
          return accumulator;
        };
      const geneBins = ids.reduce(reducer, {});
      // make a gene request action for each source bin
      const actions = Object.entries(geneBins)
        .map(([source, names]: [string, string[]]) => {
          return new geneActions.Get({names, source});
        });
      return actions;
    }),
  );

  // get genes via the gene service
  @Effect()
  getGenes$ = this.actions$.pipe(
    ofType(geneActions.GET),
    map((action: geneActions.Get) => ({action: action.id, ...action.payload})),
    withLatestFrom(this.store.select(fromGene.getLoading)),
    concatMap(([{action, names, source}, loading]) => {
      // get loaded/loading genes
      const actionGeneID =
        ({name, source, action}) => `${geneID(name, source)}:${action}`;
      const loadingIDs = new Set(loading.map(actionGeneID));
      // only keep genes whose action is loading
      const filteredNames = names.filter((name) => {
          const id = actionGeneID({name, source, action});
          return loadingIDs.has(id);
        });
      // get the genes
      if (filteredNames.length == 0) {
        return [];
      }
      return this.geneService.getGenes(filteredNames, source).pipe(
        map((genes: Gene[]) =>  new geneActions.GetSuccess({genes})),
        catchError((error) => of(new geneActions.GetFailure({names, source})))
      );
    })
  );

  // get all genes for the selected micro-tracks
  @Effect()
  getMicroTrackGenes$ = this.store.select(fromMicroTracks.getAllMicroTracks).pipe(
    switchMap((tracks) => geneActions.tracksToGetGeneActions(tracks)),
  );

}
