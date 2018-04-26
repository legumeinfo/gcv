// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate, PRIMARY_OUTLET, Router,
  RouterStateSnapshot, UrlSegment } from '@angular/router';
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
// store
import { Store } from "@ngrx/store";
import * as alignedMicroTracksActions from "../actions/aligned-micro-tracks.actions";
import * as clusteredMicroTracksActions from "../actions/clustered-micro-tracks.actions";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as multiMacroTracksActions from "../actions/multi-macro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromClusteredMicroTracks from "../reducers/clustered-micro-tracks.store";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromMultiMacroChromosome from "../reducers/multi-macro-chromosome.store";
import * as fromRouter from "../reducers/router.store";
// app
import { MultiComponent } from "../components/multi/multi.component";

@Injectable()
export class MultiGuard implements CanActivate, CanDeactivate<MultiComponent> {

  private activated: BehaviorSubject<boolean>;

  constructor(private router: Router, private store: Store<fromRoot.State>) {
    this.activated = new BehaviorSubject(false);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.activated.getValue()) {
      this.activated.next(true);
      this._microSubscriptions();
      this._clusteringSubscriptions();
      this._alignmentSubscriptions();
      this._macroSubscriptions();
    }
    return true;
  }

  canDeactivate(
    component: MultiComponent,
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
    const stop = this.activated.filter((isActive) => !isActive);
    // subscribe to observables that trigger multi track retrievals
    const multiRoute = this.store.select(fromRouter.getMultiRoute)
      .filter((route) => route.genes !== undefined)
      .distinctUntilChanged((a, b) => {
        return JSON.stringify(a.genes.slice().sort()) === JSON.stringify(b.genes.slice().sort());
      });
    const queryParams = this.store.select(fromRouter.getMicroQueryParams)
      .distinctUntilChanged((a, b) => {
        return a.neighbors === b.neighbors &&
               JSON.stringify(a.sources.slice().sort()) === JSON.stringify(b.sources.slice().sort());
      });
    Observable
      .combineLatest(multiRoute, queryParams)
      .takeUntil(stop)
      .subscribe(([route, params]) => {
        this.store.dispatch(new microTracksActions.GetMulti({
          query: route.genes,
          neighbors: params.neighbors,
          sources: params.sources,
        }));
      });
  }

  private _clusteringSubscriptions() {
    const stop = this.activated.filter((isActive) => !isActive);
    // subscribe to changes that initialize clustering
    const microTracks = this.store.select(fromMicroTracks.getMicroTracks);
    const clusteringParams = this.store.select(fromRouter.getMicroClusteringParams)
      .distinctUntilChanged((a, b) => {
        return a.alpha === b.alpha &&
               a.kappa === b.kappa &&
               a.minsup === b.minsup &&
               a.minsize === b.minsize;
      });
    Observable
      .combineLatest(microTracks, clusteringParams)
      .takeUntil(stop)
      .subscribe(([tracks, params]) => {
        this.store.dispatch(new clusteredMicroTracksActions.Get({tracks, params}));
      });
  }

  private _alignmentSubscriptions() {
    const stop = this.activated.filter((isActive) => !isActive);
    // subscribe to changes that trigger new multi alignments
    const clusteredMicroTracks = this.store.select(fromClusteredMicroTracks.getClusteredMicroTracks)
      .filter((tracks) => tracks !== undefined);
    clusteredMicroTracks
      .takeUntil(stop)
      .subscribe((tracks) => {
        this.store.dispatch(new alignedMicroTracksActions.Init());
        this.store.dispatch(new alignedMicroTracksActions.GetMulti({tracks}));
      });
  }

  private _macroSubscriptions() {
    const stop = this.activated.filter((isActive) => !isActive);
    // load new macro tracks when the block params change
    const blockParams = this.store.select(fromRouter.getMacroBlockParams)
      .distinctUntilChanged((a, b) => {
        return a.bmatched === b.bmatched &&
               a.bintermediate === b.bintermediate &&
               a.bmask === b.bmask;
      });
    const macroChromosomes = this.store.select(fromMultiMacroChromosome.getMultiMacroChromosomes);
    const querySources = this.store.select(fromRouter.getMicroQueryParamSources);
    blockParams
      .withLatestFrom(macroChromosomes, querySources)
      .takeUntil(stop)
      .subscribe(([params, chromosomes, sources]) => {
        this.store.dispatch(new multiMacroTracksActions.Init());
        let targets = chromosomes.map((c) => c.name);
        for (const query of chromosomes) {
          this.store.dispatch(new multiMacroTracksActions.Get({
            query,
            params,
            targets,
            sources
          }));
          targets = targets.filter((name) => name !== query.name);
        }
      });
  }
}
