// Angular
//import { Location } from "@angular/common";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

// store
import { Store } from "@ngrx/store";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
import * as fromRoot from "../reducers";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromQueryParams from "../reducers/query-params.store";
import * as fromRouter from "../reducers/router.store";
import * as fromSearchQueryTrack from "../reducers/search-query-track.store";

// app
import { AppConfig } from "../app.config";
import { argsByValue } from "../decorators/args-by-value.decorator";
import { Family } from "../models/family.model";
import { Gene } from "../models/gene.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { QueryParams } from "../models/query-params.model";
import { GET, POST, Request, Server } from "../models/server.model";

@Injectable()
export class MicroTracksService {
  microTracks: Observable<MicroTracks>;
  queryParams: Observable<QueryParams>;
  searchQueryTrack: Observable<Group>;

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient,
              //private location: Location,
              private store: Store<fromRoot.State>) {

    // initialize observables
    this.microTracks = this.store.select(fromMicroTracks.getMicroTracks);
    this.queryParams = this.store.select(fromQueryParams.getQueryParams);
    this.searchQueryTrack = this.store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .filter((queryTrack) => queryTrack !== undefined);
    const routeParams = this.store.select(fromRouter.getParams);
    const multiRoute = this.store.select(fromRouter.getMultiRoute);
    const queryParamsNeighbors = this.store.select(fromQueryParams.getQueryParamsNeighbors);
    const searchRoute = this.store.select(fromRouter.getSearchRoute);

    // subscribe to observables that trigger query track retrievals
    Observable
      //.combineLatest(searchRoute, queryParamsNeighbors)
      .combineLatest(routeParams, queryParamsNeighbors)
      .filter(([routeParams, neighbors]) => routeParams.gene !== undefined)
      .subscribe(([routeParams, neighbors]) => {
        this.geneSearch(routeParams, neighbors);
      });

    // subscribe to observables that trigger new searches
    Observable
      .combineLatest(this.searchQueryTrack, this.queryParams)
      .subscribe(([query, params]) => {
        this.trackSearch(query, params);
      });

    // subscribe to observables that trigger multi track retrievals
    Observable
      .combineLatest(routeParams, this.queryParams)
      .filter(([routeParams, neighbors]) => routeParams.genes !== undefined)
      .subscribe(([routeParams, params]) => {
        this.multiQuery(routeParams, params);
      });
  }

  // fetches multi tracks for the given genes
  multiQuery(query: any, params: QueryParams): void {
    console.log(query);
    console.log(params);
    this.store.dispatch(new microTracksActions.New());
    const body = {
      genes: query.genes,
      neighbors: params.neighbors,
    };
    const sources = params.sources.reduce((l, s) => {
      const i = this.serverIDs.indexOf(s);
      if (i > -1) {
        l.push(AppConfig.SERVERS[i]);
      }
      return l;
    }, []);
    for (const s of sources) {
      if (s.hasOwnProperty("microMulti")) {
        this._makeRequest<MicroTracks>(s.microMulti, body)
          .subscribe(
            (microTracks) => {
              console.log(microTracks);
              this._mergeOverlappingTracks(microTracks);
              this._addSourceToTracks(s.id, microTracks);
              this.store.dispatch(new microTracksActions.Add(microTracks));
            },
            (error) => {
              console.log(error);
              // TODO: throw error
              // this.location.back();
            },
          );
      }
    }
  }

  // fetches a query track for the given gene
  geneSearch(query: any, neighbors: number): void {
    const idx: number = this.serverIDs.indexOf(query.source);
    if (idx > -1) {
      const s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty("microQuery")) {
        const body = {
          gene: query.gene,
          neighbors: String(neighbors),
        };
        this._makeRequest<Group>(s.microQuery, body)
          .subscribe(
            (queryTrack) => {
              this._addSourceToTrack(query.source, queryTrack);
              this.store.dispatch(new searchQueryTrackActions.New(queryTrack));
            },
            (error) => {
              console.log(error);
              // TODO: throw error
              // this.location.back();
            },
          );
      }
    } else {
      // TODO: throw error
    }
  }

  trackSearch(query: Group, queryParams: QueryParams): void {
    this.store.dispatch(new microTracksActions.New());
    const body = {
      intermediate: String(queryParams.intermediate),
      matched: String(queryParams.matched),
      query: query.genes.map((g) => g.family),
    };
    const params = new HttpParams({fromObject: body});
    const requests: Array<Observable<Response>> = [];
    const sources = queryParams.sources.reduce((l, s) => {
      const i = this.serverIDs.indexOf(s);
      if (i !== -1) {
        l.push(AppConfig.SERVERS[i]);
      }
      return l;
    }, []);
    for (const s of sources) {
      if (s.hasOwnProperty("microSearch")) {
        this._makeRequest<MicroTracks>(s.microSearch, body)
          .subscribe(
            (microTracks) => {
              console.log(microTracks);
              this._mergeOverlappingTracks(microTracks);
              this._addSourceToTracks(s.id, microTracks);
              this.store.dispatch(new microTracksActions.Add(microTracks));
            },
            (error) => {
              console.log(error);
              // TODO: throw error
              // this.location.back();
            },
          );
      }
    }
  }

  @argsByValue()
  updateParams(params: QueryParams): void {
    // let action = {type: StoreActions.UPDATE_QUERY_PARAMS, payload: params};
    // this._store.dispatch(action);
  }

  // encapsulates HTTP request boilerplate
  private _makeRequest<T>(request: Request, body: any): Observable<T> {
    const params = new HttpParams({fromObject: body});
    if (request.type === GET) {
      return this.http.get<T>(request.url, {params});
    } else if (request.type === POST) {
      return this.http.post<T>(request.url, body);
    }
    return Observable.throw("Request type is not GET or POST");
  }

  // adds the server id the track came from to the track and its genes
  private _addSourceToTrack(source: string, track: Group): void {
    track.source = source;
    for (const gene of track.genes) {
      gene.source = source;
    }
  }

  // calls _addSourceToTrack on each track in the given microtracks
  private _addSourceToTracks(source: string, tracks: MicroTracks): void {
    for (const group of tracks.groups) {
      this._addSourceToTrack(source, group);
    }
  }

  // merges all the groups in the given array into a single group
  private _mergeTracks(toMerge: Group[]): Group {
    const merged: Group = Object.assign({}, toMerge[0]);
    merged.genes = toMerge[0].genes.slice();
    const seen = new Set(merged.genes.map((g) => g.id));
    for (let i = 1; i < toMerge.length; i++) {
      for (const g of toMerge[i].genes) {
        if (!seen.has(g.id)) {
          seen.add(g.id);
          merged.genes.push(g);
        }
      }
    }
    return merged;
  }

  // updates the given MicroTracks set of tracks by combining overlapping tracks
  private _mergeOverlappingTracks(tracks: MicroTracks): void {
    const groups = [];
    const bins = {};
    for (const t of tracks.groups) {
      const id = t.species_id.toString() + t.chromosome_id.toString();
      if (!bins.hasOwnProperty(id)) {
        bins[id] = [];
      }
      bins[id].push(t);
    }
    for (const id of Object.keys(bins)) {
      const bin = bins[id];
      if (bin.length > 1) {
        const breaks = [];
        for (let i = 0; i < bin.length; i++) {
          const mins = bin[i].genes.map((g) => Math.min(g.fmin, g.fmax));
          const maxs = bin[i].genes.map((g) => Math.max(g.fmin, g.fmax));
          const begin = Math.min.apply(null, mins);
          const end = Math.max.apply(null, maxs);
          breaks.push({v: begin, c: 1, i});
          breaks.push({v: end, c: -1, i});
        }
        breaks.sort((a, b) => {
          if (a.v < b.v || a.v > b.v) {
            return a.v - b.v;
          } else if (a.c < b.c || a.c > b.c) {
            return b.c - a.c;
          }
          return a.i - b.i;
        });
        let counter = 0;
        let toMerge = [];
        for (const b of breaks) {
          if (b.c > 0) {
            toMerge.push(bin[b.i]);
          }
          counter += b.c;
          if (counter === 0) {
            const merged = this._mergeTracks(toMerge);
            groups.push(merged);
            toMerge = [];
          }
        }
      } else {
        groups.push(bin[0]);
      }
    }
    tracks.groups = groups;
  }

  //private _idTracks(tracks: MicroTracks): void {
  //  for (let i = 0; i < tracks.groups.length; ++i) {
  //    tracks.groups[i].id = i;
  //  }
  //}
}
