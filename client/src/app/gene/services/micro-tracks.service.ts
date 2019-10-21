// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, empty, throwError } from 'rxjs';
import { catchError, filter, map, take } from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import * as routerActions from '@gcv/core/store/actions/router.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
// app
import { AppConfig } from '@gcv/app.config';
import { Group, QueryParams, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin, PointMixin } from '@gcv/gene/models/mixins';
import { HttpService } from '@gcv/core/services/http.service';

@Injectable()
export class MicroTracksService extends HttpService {
  queryParams: Observable<QueryParams>;
  routeParams: Observable<any>;
  searchQueryTrack: Observable<Group>;

  clusterIDs: Observable<number[]>;
  allTracks: Observable<(Track | ClusterMixin | AlignmentMixin)[]>;

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
    this.clusterIDs = _store.select(fromMicroTracks.getClusterIDs);
    this.allTracks = _store.select(fromMicroTracks.getAllClusteredAndAlignedMicroTracks);
    // initialize observables
    this.queryParams = _store.select(fromRouter.getMicroQueryParams);
    //this.searchQueryTrack = store.select(fromSearchQueryTrack.getSearchQueryTrack)
    //  .pipe(filter((queryTrack) => queryTrack !== undefined));
    this.routeParams = _store.select(fromRouter.getParams);
  }

  microTracksSearch(families: string[], params: QueryParams, serverID: string):
  Observable<Track[]> {
    const body = {
      intermediate: String(params.intermediate),
      matched: String(params.matched),
      query: families,
    };
    return this._makeRequest<{tracks: Track[]}>(serverID, 'microSearch', body)
      .pipe(
        map(({tracks}) => tracks),
        catchError((error) => throwError(error)));
  }

  updateParams(params: QueryParams): void {
    const path = [];
    const query = Object.assign({}, params, {sources: params.sources.join(',')});
    this._store.dispatch(new routerActions.Go({path, query}));
  }

  scroll(step: number): Observable<any> {
    //return Observable.create((observer) => {
    //  combineLatest(
    //    this.routeParams,
    //    this.store.select(fromMacroChromosome.getMacroChromosome))
    //  .pipe(take(1))
    //  .subscribe(([route, chromosome]) => {
    //    if (route.gene !== undefined) {
    //      const i = chromosome.genes.indexOf(route.gene);
    //      if (i > -1 && i + step >= 0 && i + step < chromosome.genes.length) {
    //        const gene = chromosome.genes[i + step];
    //        const path = ['search', route.source, gene];
    //        this.store.dispatch(new routerActions.Go({path}));
    //      } else {
    //        observer.error(new Error('Cannot compute target focus gene'));
    //      }
    //    } else {
    //      observer.error(new Error('Cannot scroll at this time'));
    //    }
    //    observer.complete();
    //  });
    //});
    return empty();
  }

  spanSearch(chromosome: string, low: number, high: number): void {
    // search the default (first) server for now
    const source = AppConfig.SERVERS[0].id;
    const url = '/search' +
          '/' + source +
          '/' + chromosome +
          '/' + low + '-' + high;
    this._store.dispatch(new routerActions.Go({path: [url, { routeParam: 1 }]}));
  }

  // returns all the aligned micro-tracks (selected and search result) belonging
  // to the given cluster
  getCluster(id: number): Observable<(Track | ClusterMixin | AlignmentMixin)[]>
  {
    return this._store.pipe(
      select(fromMicroTracks.getAlignedMicroTrackCluster(id))
    );
  }
}
