// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs/observable/of";
import { catchError, map, switchMap } from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import * as macroTracksActions from "../actions/macro-tracks.actions";
import * as fromRoot from "../reducers";
// services
import { MacroTracksService } from "../services/macro-tracks.service";

@Injectable()
export class MacroTracksEffects {

  constructor(private actions$: Actions,
              private macroTracksService: MacroTracksService,
              private store: Store<fromRoot.State>) { }

  @Effect()
  getChromosome$ = this.actions$.pipe(
    ofType(macroChromosomeActions.GET),
    map((action: macroChromosomeActions.Get) => action.payload),
    switchMap(({chromosome, source}) => {
      return this.macroTracksService.getChromosome(chromosome, source).pipe(
        map(chromosome => new macroChromosomeActions.GetSuccess({chromosome})),
        catchError(error => of(new macroChromosomeActions.GetFailure(error)))
      );
    })
  );

  @Effect()
  getMacroTracks$ = this.actions$.pipe(
    ofType(macroTracksActions.GET),
    map((action: macroTracksActions.Get) => action.payload),
    switchMap(({query, params, sources}) => {
      return this.macroTracksService.getFederatedMacroTracks(query, params, sources).pipe(
        map(([source, tracks]) => new macroTracksActions.GetSuccess({tracks, source})),
        catchError(([source, error]) => of(new macroTracksActions.GetFailure({error, source})))
      )
    })
  );
}
