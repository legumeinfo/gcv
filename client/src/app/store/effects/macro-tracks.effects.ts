// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { combineLatest, of } from "rxjs";
import { catchError, map, mergeMap, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import * as macroTracksActions from "../actions/macro-tracks.actions";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as multiMacroChromosomeActions from "../actions/multi-macro-chromosome.actions";
import * as multiMacroTracksActions from "../actions/multi-macro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromMultiMacroChromosome from "../reducers/multi-macro-chromosome.store";
import * as fromRouter from "../reducers/router.store";
// services
import { MacroTracksService } from "../../services";

@Injectable()
export class MacroTracksEffects {

  constructor(private actions$: Actions,
              private macroTracksService: MacroTracksService,
              private store: Store<fromRoot.State>) { }

  // search

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

  // multi

  @Effect()
  initMultiMacro$ = this.actions$.pipe(
    ofType(microTracksActions.GET_MULTI),
    map((action: microTracksActions.GetMulti) => action.payload),
    switchMap(({query, neighbors, sources}) => {
      return [
        new multiMacroChromosomeActions.Init(),
        new multiMacroTracksActions.Init(),
      ];
    })
  );

  @Effect()
  getMultiTracksSuccess$ = this.actions$.pipe(
    ofType(microTracksActions.GET_MULTI_SUCCESS),
    map((action: microTracksActions.GetMultiSuccess) => action.payload),
    withLatestFrom(this.store.select(fromMicroTracks.getMicroTracks)),
    map(([{tracks, source}, existingTracks]) => {
      // assumes tracks is appended to the end of existingTracks
      const uniqueLoadedChromosomes = new Set(
        existingTracks.groups
          .slice(0, existingTracks.groups.length - tracks.groups.length)
          .map((g) => g.chromosome_name)
      );
      // only fetch chromosomes for tracks whose chromosome hasn't been loaded yet
      const chromosomes = tracks.groups
        .filter((g) => {
          if (uniqueLoadedChromosomes.has(g.chromosome_name)) {
            return false;
          }
          uniqueLoadedChromosomes.add(g.chromosome_name);
          return true;
        })
        .map((group) => {
          return {
            name: group.chromosome_name,
            genus: group.genus,
            species: group.species,
          };
        });
      return new multiMacroChromosomeActions.Get({chromosomes, source});
    })
  );

  @Effect()
  getMultiChromosomes$ = this.actions$.pipe(
    ofType(multiMacroChromosomeActions.GET),
    map((action: multiMacroChromosomeActions.Get) => action.payload),
    mergeMap(({chromosomes, source}) => {
      const stop = combineLatest(
        this.actions$.pipe(ofType(microTracksActions.GET_MULTI)),
        this.actions$.pipe(ofType(multiMacroTracksActions.INIT)),
      );
      return this.macroTracksService.getChromosomes(chromosomes, source).pipe(
        takeUntil(stop),
        map(([query, chromosome]) => {
          chromosome.source = source;
          chromosome.name = query.name;
          chromosome.genus = query.genus;
          chromosome.species = query.species;
          return new multiMacroChromosomeActions.GetSuccess({chromosome, source});
        }),
        catchError(([source, error]) => of(new multiMacroChromosomeActions.GetFailure({error, source})))
      )
    })
  );

  @Effect()
  getMultiChromosomesSuccess$ = this.actions$.pipe(
    ofType(multiMacroChromosomeActions.GET_SUCCESS),
    map((action: multiMacroChromosomeActions.GetSuccess) => action.payload),
    withLatestFrom(
      this.store.select(fromRouter.getMacroBlockParams),
      this.store.select(fromMultiMacroChromosome.getMultiMacroChromosomes),
      this.store.select(fromRouter.getMicroQueryParamSources),
    ),
    map(([{chromosome}, params, targetChromosomes, sources]) => {
      return new multiMacroTracksActions.Get({
        query: chromosome,
        params,
        targets: targetChromosomes.map((c) => c.name),
        sources
      });
    })
  );

  @Effect()
  getMultiMacroTracks$ = this.actions$.pipe(
    ofType(multiMacroTracksActions.GET),
    map((action: multiMacroTracksActions.Get) => action.payload),
    mergeMap(({query, params, targets, sources}) => {
      const stop = combineLatest(
        this.actions$.pipe(ofType(microTracksActions.GET_MULTI)),
        this.store.select(fromRouter.getMacroBlockParams),
      );
      return this.macroTracksService.getFederatedMacroTracks(
        query,
        params,
        sources,
        targets
      ).pipe(
        takeUntil(stop),
        map(([source, tracks]) => {
          const chromosome = query.name;
          return new multiMacroTracksActions.GetSuccess({chromosome, tracks, source});
        }),
        catchError(([source, error]) => of(new multiMacroTracksActions.GetFailure({error, source})))
      )
    })
  );
}
