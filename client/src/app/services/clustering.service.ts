// Angular + dependencies
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// import { Store }      from "@ngrx/store";

// App
import { GCV } from "../../assets/js/gcv";
import { AppRoutes } from "../constants/app-routes";
import { StoreActions } from "../constants/store-actions";
import { argsByValue } from "../decorators/args-by-value.decorator";
import { AppStore } from "../models/app-store.model";
import { ClusteringParams } from "../models/clustering-params.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { AppRouteService } from "./app-route.service";

@Injectable()
export class ClusteringService extends AppRouteService {
  clusteringParams: Observable<ClusteringParams>;

  constructor(/*private _store: Store<AppStore>*/) {
    super(/*_store*/);

    // initialize observables
    // this.clusteringParams = this._store.select("clusteringParams");
    // let microTracks       = this._store.select<MicroTracks>("microTracks");
    this.clusteringParams = Observable.empty<ClusteringParams>();
    const microTracks = Observable.empty<MicroTracks>();

    // subscribe to changes that initialize clustering
    Observable
      .combineLatest(microTracks, this.clusteringParams)
      .filter(([tracks, params]) => this.route === AppRoutes.MULTI)
      .subscribe(([tracks, params]) => {
        this.clusterMicroTracks(tracks, params);
      });
  }

  @argsByValue()
  clusterMicroTracks(tracks: MicroTracks, params: ClusteringParams): void {
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
      results = GCV.graph.frequentedRegions(tracks, params.alpha,
        params.kappa, params.minsup, params.minsize, {omit: [""]});
      let max   = null;
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
        const copyTracks = JSON.parse(JSON.stringify(tracks)).groups;
        for (const s of supporting) {
          group.push(copyTracks[s]);
        }
        for (const g of group) {
          const gId = "group-" + j + ".";
          g.chromosome_name = gId.concat(g.chromosome_name);
          g.cluster = j;
        }
        // grouped = grouped.concat(GCV.alignment.msa(group));
        grouped = grouped.concat(group);
        tracks.groups = tracks.groups.filter((t, i) => {
          return supporting.indexOf(i) === -1;
        });
      }
      j++;
    } while (results.length > 0);
    const gId = "group-none.";
    for (const g of tracks.groups) {
      g.chromosome_name = gId.concat(g.chromosome_name);
    }
    tracks.groups = grouped.concat(tracks.groups);
    // let action = {type: StoreActions.NEW_CLUSTERED_TRACKS, payload: tracks};
    // this._store.dispatch(action);
  }

  @argsByValue()
  updateParams(params: ClusteringParams): void {
    // let action = {type: StoreActions.UPDATE_CLUSTERING_PARAMS, payload: params};
    // this._store.dispatch(action);
  }
}
