// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, takeUntil,
  withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as fromRoot from '@gcv/store/reducers';
import { geneID, idArrayIntersection }
  from '@gcv/gene/store/reducers/gene.reducer';
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

  // clear the store every time the set of selected genes changes
  @Effect()
  clearGenes$ = this.store.select(fromGene.getSelectedGeneIDs).pipe(
    map((...args) => new geneActions.Clear()),
  );

  // emits a get action for each selected gene
  @Effect()
  getSelected$ = this.store.select(fromGene.getSelectedGeneIDs).pipe(
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
    withLatestFrom(
      this.store.select(fromGene.getSelectedGeneIDs),
      this.store.select(fromGene.getLoading),
    ),
    concatMap(([{action, names, source}, selectedIDs, loading]) => {
      let targetIDs = names.map((name) => ({name, source, action}));
      // only keep targets that the reducer says need to be loaded (no need to
      // check loaded since the reducer already took that into consideration)
      targetIDs = idArrayIntersection(targetIDs, loading, true);
      if (targetIDs.length == 0) {
        return [];
      }
      const filteredNames = targetIDs.map((id) => id.name);
      return this.geneService.getGenes(filteredNames, source).pipe(
        takeUntil(this.actions$.pipe(ofType(geneActions.CLEAR))),
        switchMap((genes: Gene[]) => {
          const actions: geneActions.Actions[] = [];
          const successNames = new Set(genes.map((g) => g.name));
          const failedNames = filteredNames.filter((n) => !successNames.has(n));
          if (failedNames.length > 0) {
            const payload = {names: failedNames, source};
            const failureAction = new geneActions.GetFailure(payload);
            actions.push(failureAction);
          }
          const successAction = new geneActions.GetSuccess({genes});
          actions.push(successAction);
          return actions;
        }),
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
