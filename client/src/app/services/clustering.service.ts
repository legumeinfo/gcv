// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// store
import { Store } from "@ngrx/store";
import * as clusteredMicroTracksActions from "../actions/clustered-micro-tracks.actions";
import * as clusteringParamActions from "../actions/clustering-params.actions";
import * as fromRoot from "../reducers";
import * as fromClusteredMicroTracks from "../reducers/clustered-micro-tracks.store";
import * as fromClusteringParams from "../reducers/clustering-params.store";
import * as fromMicroTracks from "../reducers/micro-tracks.store";// App
import * as fromRouter from "../reducers/router.store";
// app
import { GCV } from "../../assets/js/gcv";
import { ClusteringParams } from "../models/clustering-params.model";
import { MicroTracks } from "../models/micro-tracks.model";

@Injectable()
export class ClusteringService {
  clusteredMicroTracks: Observable<MicroTracks>;
  clusteringParams: Observable<ClusteringParams>;

  constructor(private store: Store<fromRoot.State>) {
    // initialize observables
    this.clusteredMicroTracks = this.store.select(fromClusteredMicroTracks.getClusteredMicroTracks);
    this.clusteringParams = this.store.select(fromClusteringParams.getClusteringParams);
    const microTracks = this.store.select(fromMicroTracks.getMicroTracks);
    const routeParams = this.store.select(fromRouter.getParams);

    // subscribe to changes that initialize clustering
    Observable
      .combineLatest(microTracks, this.clusteringParams)
      .withLatestFrom(routeParams)
      .filter(([[tracks, params], route]) => {
        return route.genes !== undefined;
      })
      .subscribe(([[tracks, params], route]) => {
        this.clusterMicroTracks(tracks, params);
      });
  }

  clusterMicroTracks(tracks: MicroTracks, params: ClusteringParams): void {
    this.store.dispatch(new clusteredMicroTracksActions.New());
    // create modifiable extension of tracks
    const clusteredTracks = new MicroTracks();
    clusteredTracks.families = tracks.families;
    clusteredTracks.groups = tracks.groups.map((g) => Object.create(g));
    // cluster the tracks
    let grouped  = [];
    let results  = [];
    const aggregateSupport = (fr, identified?) => {
      if (identified === undefined) {
        identified = new Set();
      }
      let supporting = fr.supporting.map((n) => parseInt(n, 10)).filter((n, i) => {
        return !identified.has(n);
      });
      for (const s of supporting) {
        identified.add(s);
      }
      for (const d of fr.descendants) {
        supporting = supporting.concat(aggregateSupport(d, identified));
      }
      return supporting;
    };
    let j = 0;
    do {
      results = GCV.graph.frequentedRegions(clusteredTracks, params.alpha,
        params.kappa, params.minsup, params.minsize, {omit: [""]});
      let max = null;
      let maxFR = null;
      for (const r of results) {
        if (max == null || r.nodes.length > max) {
          max = r.nodes.length;
          maxFR = r;
        }
      }
      if (maxFR != null) {
        const supporting = aggregateSupport(maxFR);
        const group = [];
        for (const s of supporting) {
          const g = clusteredTracks.groups[s];
          g.cluster = j;
          group.push(g);
        }
        grouped = grouped.concat(group);
        clusteredTracks.groups = clusteredTracks.groups.filter((t, i) => {
          return supporting.indexOf(i) === -1;
        });
      }
      j++;
    } while (results.length > 0);
    // push results to store
    // TODO: push results incrementally rather than all at the end
    clusteredTracks.groups = grouped.concat(clusteredTracks.groups);
    this.store.dispatch(new clusteredMicroTracksActions.Add(clusteredTracks));
  }

  updateParams(params: ClusteringParams): void {
    this.store.dispatch(new clusteringParamActions.New(params));
  }
}
