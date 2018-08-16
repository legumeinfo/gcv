// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate, PRIMARY_OUTLET, Router,
  RouterStateSnapshot , UrlSegment} from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { distinctUntilChanged, filter, map, pairwise, takeUntil, withLatestFrom } from "rxjs/operators";
// store
import { Store } from "@ngrx/store";
import * as alignedMicroTracksActions from "../store/actions/aligned-micro-tracks.actions";
import * as globalPlotsActions from "../store/actions/global-plots.actions";
import * as macroChromosomeActions from "../store/actions/macro-chromosome.actions";
import * as macroTracksActions from "../store/actions/macro-tracks.actions";
import * as microTracksActions from "../store/actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../store/actions/search-query-track.actions";
import * as fromRoot from "../store/reducers";
import * as fromAlignedMicroTracks from "../store/reducers/aligned-micro-tracks.store";
import * as fromGlobalPlots from "../store/reducers/global-plots.store";
import * as fromLocalPlots from "../store/reducers/local-plots.store";
import * as fromMacroChromosome from "../store/reducers/macro-chromosome.store";
import * as fromMicroTracks from "../store/reducers/micro-tracks.store";
import * as fromRouter from "../store/reducers/router.store";
import * as fromSearchQueryTrack from "../store/reducers/search-query-track.store";
// app
import { SearchComponent } from "../components";

@Injectable()
export class SearchGuard implements CanActivate, CanDeactivate<SearchComponent> {

  private activated: BehaviorSubject<boolean>;

  constructor(private router: Router, private store: Store<fromRoot.State>) {
    this.activated = new BehaviorSubject(false);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.activated.getValue()) {
      this.activated.next(true);
      this._microSubscriptions();
      this._alignmentSubscriptions();
      this._macroSubscriptions();
      this._plotSubscriptions();
    }
    return true;
  }

  canDeactivate(
    component: SearchComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): boolean {
    const currentSegments = this._getUrlSegments(currentState.url);
    const nextSegments = this._getUrlSegments(nextState.url);
    if (currentSegments[0].path !== nextSegments[0].path) {
      this.activated.next(false);
    }
    return true;
  }

  private _getUrlSegments(url: string): UrlSegment[] {
    const tree = this.router.parseUrl(url);
    const g = tree.root.children[PRIMARY_OUTLET];
    return g.segments;
  }

  private _microSubscriptions() {
    const stop = this.activated.pipe(filter((isActive) => !isActive));
    // load a new query track when the search route or neighbors param changes
    const searchRoute = this.store.select(fromRouter.getSearchRoute)
      .pipe(
        filter((route) => route.source !== undefined && route.gene !== undefined),
        distinctUntilChanged((a, b) => a.source === b.source && a.gene === b.gene));
    const neighborsParam = this.store.select(fromRouter.getMicroQueryParamNeighbors);
    combineLatest(searchRoute, neighborsParam)
      .pipe(takeUntil(stop))
      .subscribe(([query, neighbors]) => {
        this.store.dispatch(new searchQueryTrackActions.Get({query, neighbors}));
      });
    // load new search tracks when there's a new query track
    const queryTrack = this.store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .pipe(filter((queryTrack) => queryTrack !== undefined));
    const queryParams = this.store.select(fromRouter.getMicroQueryParams)
      .pipe(distinctUntilChanged((a, b) => {
        return a.neighbors === b.neighbors &&
               a.matched  === b.matched &&
               a.intermediate === b.intermediate &&
               JSON.stringify(a.sources.slice().sort()) === JSON.stringify(b.sources.slice().sort());
      }));
    queryTrack
      .pipe(
        withLatestFrom(queryParams),
        takeUntil(stop))
      .subscribe(([query, params]) => {
        this.store.dispatch(new microTracksActions.GetSearch({
          query,
          params: params,
          sources: params.sources,
        }));
      });
    // load new search tracks when the search params change
    queryParams
      .pipe(
        pairwise(),
        filter(([prevParams, nextParams]) => prevParams.neighbors === nextParams.neighbors),
        map(([prevParams, nextParams]) => nextParams),
        withLatestFrom(queryTrack),
        takeUntil(stop))
      .subscribe(([params, query]) => {
        this.store.dispatch(new microTracksActions.GetSearch({
          query,
          params: params,
          sources: params.sources,
        }));
      });
  }

  private _alignmentSubscriptions() {
    const stop = this.activated.pipe(filter((isActive) => !isActive));
    // subscribe to changes that trigger new pairwise alignments
    const alignmentParams = this.store.select(fromRouter.getMicroAlignmentParams)
      .pipe(distinctUntilChanged((a, b) => {
        return a.algorithm === b.algorithm &&
               a.match  === b.match &&
               a.mismatch === b.mismatch &&
               a.gap === b.gap &&
               a.score === b.score &&
               a.threshold === b.threshold;
      }));
    const microReference = this.store.select(fromAlignedMicroTracks.getAlignmentReference)
      .pipe(filter((reference) => reference !== undefined));
    const microTracks = this.store.select(fromMicroTracks.getMicroTracks);
    // TODO: prevent alignments when query params change too
    alignmentParams
      .pipe(
        withLatestFrom(microReference, microTracks),
        takeUntil(stop))
      .subscribe(([params, reference, tracks]) => {
        this.store.dispatch(new alignedMicroTracksActions.Init({reference}));
        this.store.dispatch(new alignedMicroTracksActions.GetPairwise({tracks, params}));
      });
  }

  private _macroSubscriptions() {
    const stop = this.activated.pipe(filter((isActive) => !isActive));
    // subscribe to changes that initialize macro chromosome searches
    const searchQueryChromosome = this.store.select(fromSearchQueryTrack.getSearchQueryChromosome)
      .pipe(filter((chromosome) => chromosome !== undefined));
    const searchRouteSource = this.store.select(fromRouter.getSearchRouteSource);
    searchQueryChromosome
      .pipe(
        withLatestFrom(searchRouteSource),
        takeUntil(stop))
      .subscribe(([chromosome, source]) => {
        this.store.dispatch(new macroChromosomeActions.Get({chromosome, source}));
      });
    // load new macro tracks when there's a new macro chromosome
    const macroChromosome = this.store.select(fromMacroChromosome.getMacroChromosome)
      .pipe(filter((chromosome) => chromosome !== undefined));
    const blockParams = this.store.select(fromRouter.getMacroBlockParams)
      .pipe(distinctUntilChanged((a, b) => {
        return a.bmatched === b.bmatched &&
               a.bintermediate === b.bintermediate &&
               a.bmask === b.bmask;
      }));
    const querySources = this.store.select(fromRouter.getMicroQueryParamSources)
      .pipe(distinctUntilChanged((a, b) => {
        return JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort());
      }));
    macroChromosome
      .pipe(
        withLatestFrom(blockParams, querySources),
        takeUntil(stop))
      .subscribe(([query, params, sources]) => {
        this.store.dispatch(new macroTracksActions.Get({query, params, sources}));
      });
    // load new macro tracks when the block params change
    combineLatest(blockParams, querySources)
      .pipe(
        withLatestFrom(macroChromosome),
        takeUntil(stop))
      .subscribe(([[params, sources], query]) => {
        this.store.dispatch(new macroTracksActions.Get({query, params, sources}));
      });
  }

  private _plotSubscriptions() {
    // no-op
    // these are all handled in the plots effects
  }
}
