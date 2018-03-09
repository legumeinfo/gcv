// Angular
import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate } from '@angular/router';
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
// store
import { Store } from "@ngrx/store";
import * as alignedMicroTracksActions from "../actions/aligned-micro-tracks.actions";
import * as clusteredMicroTracksActions from "../actions/clustered-micro-tracks.actions";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromClusteredMicroTracks from "../reducers/clustered-micro-tracks.store";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromRouter from "../reducers/router.store";
// app
import { MultiComponent } from "../components/multi/multi.component";

@Injectable()
export class MultiGuard implements CanActivate, CanDeactivate<MultiComponent> {

  private deactivate: Subject<boolean>;

  constructor(private store: Store<fromRoot.State>) { }

  canActivate(): boolean {
    this.deactivate = new Subject();
    this.microSubscriptions();
    this.clusteringSubscriptions();
    this.alignmentSubscriptions();
    this.macroSubscriptions();
    return true;
  }

  canDeactivate(): boolean {
    this.deactivate.next(true);
    this.deactivate.complete();
    return true;
  }

  private microSubscriptions() {
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
      .takeUntil(this.deactivate)
      .subscribe(([route, params]) => {
        this.store.dispatch(new microTracksActions.GetMulti({
          query: route.genes,
          neighbors: params.neighbors,
          sources: params.sources,
        }));
      });
  }

  private clusteringSubscriptions() {
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
      .takeUntil(this.deactivate)
      .subscribe(([tracks, params]) => {
        this.store.dispatch(new clusteredMicroTracksActions.Get({tracks, params}));
      });
  }

  private alignmentSubscriptions() {
    // subscribe to changes that trigger new multi alignments
    const clusteredMicroTracks = this.store.select(fromClusteredMicroTracks.getClusteredMicroTracks)
      .filter((tracks) => tracks !== undefined);
    clusteredMicroTracks
      .takeUntil(this.deactivate)
      .subscribe((tracks) => {
        this.store.dispatch(new alignedMicroTracksActions.Init());
        this.store.dispatch(new alignedMicroTracksActions.GetMulti({tracks}));
      });
  }

  private macroSubscriptions() {

  }
}
