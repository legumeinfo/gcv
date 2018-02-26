// Angular
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// store
import { Store } from "@ngrx/store";
import * as microTracksActions from "../actions/micro-tracks.actions";
import * as searchQueryTrackActions from "../actions/search-query-track.actions";
import * as queryParamActions from "../actions/query-params.actions";
import * as fromRoot from "../reducers";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromQueryParams from "../reducers/query-params.store";
import * as fromRouter from "../reducers/router.store";
import * as fromSearchQueryTrack from "../reducers/search-query-track.store";
// app
import { AppConfig } from "../app.config";
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
  routeParams: Observable<any>;
  searchQueryTrack: Observable<Group>;

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient,
              private store: Store<fromRoot.State>) {

    // initialize observables
    this.microTracks = this.store.select(fromMicroTracks.getMicroTracks);
    this.queryParams = this.store.select(fromQueryParams.getQueryParams);
    this.searchQueryTrack = this.store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .filter((queryTrack) => queryTrack !== undefined);
    this.routeParams = this.store.select(fromRouter.getParams);
    const queryParamsNeighbors = this.store.select(fromQueryParams.getQueryParamsNeighbors);
    const searchQueryCorrelationID = this.store.select(fromSearchQueryTrack.getCorrelationID);

    // subscribe to observables that trigger query track retrievals
    Observable
      .combineLatest(this.routeParams, queryParamsNeighbors)
      .filter(([route, neighbors]) => route.gene !== undefined)
      .subscribe(([route, neighbors]) => {
        const correlationID = Date.now();
        this.geneSearch(route, neighbors, correlationID);
      });

    // subscribe to observables that trigger new searches
    this.searchQueryTrack
      .withLatestFrom(this.queryParams, searchQueryCorrelationID)
      .subscribe(([query, params, correlationID]) => {
        this.trackSearch(query, params, correlationID);
      });

    this.queryParams
      .pairwise()
      .withLatestFrom(this.routeParams, this.searchQueryTrack, searchQueryCorrelationID)
      .filter(([[previous, next], route, query, correlationID]) => {
        return route.gene !== undefined && previous.neighbors === next.neighbors;
      })
      .subscribe(([[previous, next], route, query, correlationID]) => {
        this.trackSearch(query, next, correlationID);
      })

    // subscribe to observables that trigger multi track retrievals
    Observable
      .combineLatest(this.routeParams, this.queryParams)
      .filter(([route, params]) => route.genes !== undefined)
      .subscribe(([route, params]) => {
        const correlationID = Date.now();
        this.multiQuery(route, params, correlationID);
      });
  }

  // fetches multi tracks for the given genes
  multiQuery(query: any, params: QueryParams, correlationID: number): void {
    this.store.dispatch(new microTracksActions.New(correlationID));
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
              this._mergeOverlappingTracks(microTracks);
              this._parseTracks(s.id, microTracks);
              this.store.dispatch(new microTracksActions.Add(correlationID, microTracks));
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
  geneSearch(query: any, neighbors: number, correlationID: number): void {
    this.store.dispatch(new microTracksActions.New(correlationID));
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
              this._parseTrack(query.source, queryTrack);
              this.store.dispatch(new searchQueryTrackActions.New(correlationID, queryTrack));
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

  trackSearch(query: Group, queryParams: QueryParams, correlationID: number): void {
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
              this._mergeOverlappingTracks(microTracks);
              this._parseTracks(s.id, microTracks);
              this.store.dispatch(new microTracksActions.Add(correlationID, microTracks));
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

  updateParams(params: QueryParams): void {
    this.store.dispatch(new queryParamActions.New(params));
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
  private _parseTrack(source: string, track: Group): void {
    track.source = source;
    for (const gene of track.genes) {
      gene.source = source;
      delete gene.x;
      delete gene.y;
    }
  }

  // calls _parseTrack on each track in the given microtracks
  private _parseTracks(source: string, tracks: MicroTracks): void {
    for (const group of tracks.groups) {
      this._parseTrack(source, group);
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
}
