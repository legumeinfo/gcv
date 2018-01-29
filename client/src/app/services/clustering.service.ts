// Angular + dependencies
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App
import { AppRoutes }        from '../constants/app-routes';
import { AppRouteService }  from './app-route.service';
import { AppStore }         from '../models/app-store.model';
import { ClusteringParams } from '../models/clustering-params.model';
import { GCV }              from '../../assets/js/gcv';
import { MicroTracks }      from '../models/micro-tracks.model';
import { StoreActions }     from '../constants/store-actions';

@Injectable()
export class ClusteringService extends AppRouteService {
  clusteringParams: Observable<ClusteringParams>;

  constructor(private _store: Store<AppStore>) {
    super(_store);

    // initialize observables
    this.clusteringParams = this._store.select('clusteringParams');
    let microTracks       = this._store.select<MicroTracks>('microTracks');

    // subscribe to changes that initialize clustering
    Observable
      .combineLatest(microTracks, this.clusteringParams)
      .filter(([tracks, params]) => this._route == AppRoutes.MULTI)
      .subscribe(([tracks, params]) => {
        this.clusterMicroTracks(tracks, params);
      });
  }

  clusterMicroTracks(tracks: MicroTracks, params: ClusteringParams): void {
    let grouped  = [],
        results  = [];
    let aggregateSupport = (fr, identified?) => {
      if (identified === undefined) identified = new Set();
      let supporting = fr.supporting.map(n => parseInt(n)).filter((n, i) => {
        return !identified.has(n);
      });
      for (let i = 0; i < supporting.length; i++) {
        identified.add(supporting[i]);
      }
      for (let i = 0; i < fr.descendants.length; i++) {
        supporting = supporting.concat(
          aggregateSupport(fr.descendants[i], identified)
        );
      }
      return supporting;
    }
    let j = 0;
    do {
      results = GCV.graph.frequentedRegions(tracks, params.alpha,
        params.kappa, params.minsup, params.minsize, {omit: [""]});
      let max   = null,
          maxFR = null;;
      for (let i = 0; i < results.length; i++) {
        if (max == null || results[i]["nodes"].length > max) {
          max   = results[i]["nodes"].length;
          maxFR = results[i];
        }
      }
      if (maxFR != null) {
        let supporting = aggregateSupport(maxFR),
            group      = [],
            copyTracks = JSON.parse(JSON.stringify(tracks)).groups;
        for (let i = 0; i < supporting.length; i++) {
          group.push(copyTracks[supporting[i]]);
        }
        for (let i = 0; i < group.length; i++) {
          let gId = "group-" + j + ".";
          group[i]["chromosome_name"] = gId.concat(group[i]["chromosome_name"]);
          group[i].cluster = j;
        }
        //grouped = grouped.concat(GCV.alignment.msa(group));
        grouped = grouped.concat(group);
        tracks.groups = tracks.groups.filter((t, i) => {
          return supporting.indexOf(i) == -1;
        });
      }
      j++;
    } while (results.length > 0);
    let gId = "group-none.";
    for (let i = 0; i < tracks.groups.length; i++) {
      tracks.groups[i]["chromosome_name"] =
        gId.concat(tracks.groups[i]["chromosome_name"]);
    }
    tracks.groups = grouped.concat(tracks.groups);
    let action = {type: StoreActions.NEW_CLUSTERED_TRACKS, payload: tracks};
    this._store.dispatch(action);
  }

  updateParams(params: ClusteringParams): void {
    let action = {type: StoreActions.UPDATE_CLUSTERING_PARAMS, payload: params};
    this._store.dispatch(action);
  }
}
