// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { _throw } from "rxjs/observable/throw";
import { catchError, map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../actions/router.actions";
import * as fromRoot from "../reducers";
import * as fromMacroChromosome from "../reducers/macro-chromosome.store";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromRouter from "../reducers/router.store";
import * as fromSearchQueryTrack from "../reducers/search-query-track.store";
// app
import { AppConfig } from "../app.config";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { QueryParams } from "../models/query-params.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class MicroTracksService {
  microTracks: Observable<MicroTracks>;
  queryParams: Observable<QueryParams>;
  routeParams: Observable<any>;
  searchQueryTrack: Observable<Group>;

  requests: Observable<[any, Observable<any>]>;
  private requestsSubject = new BehaviorSubject<[any, Observable<any>]>(undefined);

  constructor(private http: HttpClient, private store: Store<fromRoot.State>) {
    this.requests = this.requestsSubject.asObservable()
      .filter((request) => request !== undefined);
    // initialize observables
    this.microTracks = store.select(fromMicroTracks.getMicroTracks);
    this.queryParams = store.select(fromRouter.getMicroQueryParams);
    this.searchQueryTrack = store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .filter((queryTrack) => queryTrack !== undefined);
    this.routeParams = store.select(fromRouter.getParams);
  }

  // fetches multi tracks for the given genes from the given source
  getMultiTracks(genes: string[], neighbors: number, serverID: string): Observable<MicroTracks> {
    const body = {genes, neighbors};
    return this._makeRequest<MicroTracks>(serverID, "microMulti", body).pipe(
      map((tracks) => {
        this._mergeOverlappingTracks(tracks);
        this._parseTracks(serverID, tracks);
        return tracks;
      }),
      catchError((error) => _throw(error)),
    )
  }

  // gets a macro tracks for each server provided
  getFederatedMultiTracks(
    query: string[],
    neighbors: number,
    serverIDs: string[],
  ): Observable<[string, MicroTracks]> {
    return Observable.merge(...serverIDs.map((serverID) => {
      return this.getMultiTracks(query, neighbors, serverID).pipe(
        map((tracks) => [serverID, tracks]),
        catchError((error) => _throw([serverID, error])),
      );
    }));
  }

  // fetches a query track for the given gene from the given source
  getQueryTrack(gene: string, neighbors: number, serverID: string): Observable<Group> {
    const body = {gene, neighbors: String(neighbors)};
    return this._makeRequest<Group>(serverID, "microQuery", body).pipe(
      map((track) => {
        this._parseTrack(serverID, track);
        return track;
      }),
      catchError((error) => _throw(error)),
    );
  }

  // performs a micro track search for the given query track and params
  getSearchTracks(query: Group, params: QueryParams, serverID: string): Observable<MicroTracks> {
    const body = {
      intermediate: String(params.intermediate),
      matched: String(params.matched),
      query: query.genes.map((g) => g.family),
    };
    return this._makeRequest<MicroTracks>(serverID, "microSearch", body).pipe(
      map((tracks) => {
        this._removeQuery(query, tracks);
        this._mergeOverlappingTracks(tracks);
        this._parseTracks(serverID, tracks);
        return tracks;
      }),
      catchError((error) => _throw(error)),
    );
  }

  // performs a micro track search for each server provided
  getFederatedSearchTracks(
    query: Group,
    params: QueryParams,
    serverIDs: string[]
  ): Observable<[string, MicroTracks]> {
    return Observable.merge(...serverIDs.map((serverID) => {
      return this.getSearchTracks(query, params, serverID).pipe(
        map((tracks) => [serverID, tracks]),
        catchError((error) => _throw([serverID, error])),
      );
    }));
  }

  updateParams(params: QueryParams): void {
    const path = [];
    const query = Object.assign({}, params, {sources: params.sources.join(",")});
    this.store.dispatch(new routerActions.Go({path, query}));
  }

  scroll(step: number): Observable<any> {
    return Observable.create((observer) => {
    Observable
      .combineLatest(
        this.routeParams,
        this.store.select(fromMacroChromosome.getMacroChromosome),
      )
      .take(1)
      .subscribe(([route, chromosome]) => {
        if (route.gene !== undefined) {
          const i = chromosome.genes.indexOf(route.gene);
          if (i > -1 && i + step >= 0 && i + step < chromosome.genes.length) {
            const gene = chromosome.genes[i + step];
            const path = ["search", route.source, gene];
            this.store.dispatch(new routerActions.Go({path}));
          } else {
            observer.error(new Error("Cannot compute target focus gene"));
          }
        } else {
          observer.error(new Error("Cannot scroll at this time"));
        }
        observer.complete();
      });
    });
  }

  // encapsulates HTTP request boilerplate
  private _makeRequest<T>(serverID: string, requestType: string, body: any): Observable<T> {
    const args = {serverID, requestType, body};
    let source: Server;
    const i = AppConfig.SERVERS.map((s) => s.id).indexOf(serverID);
    if (i > -1) {
      source = AppConfig.SERVERS[i];
    } else {
      return Observable.throw("\"" + serverID + "\" is not a valid server ID");
    }
    if (!source.hasOwnProperty(requestType)) {
      return Observable.throw("\"" + serverID + "\" does not support requests of type \"" + requestType + "\"");
    }
    const request = source[requestType];
    const params = new HttpParams({fromObject: body});
    if (request.type === GET) {
      const requestObservable = this.http.get<T>(request.url, {params});
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable;
    } else if (request.type === POST) {
      const requestObservable = this.http.post<T>(request.url, body);
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable;
    }
    return Observable.throw("\"" + serverID + "\" requests of type \"" + requestType + "\" does not support HTTP GET or POST methods");
  }

  // adds the server id the track came from to the track and its genes
  private _parseTrack(source: string, track: Group, i:number = 0): void {
    track.source = source;
    track.id = source + i;
    for (const gene of track.genes) {
      gene.source = source;
      delete gene.x;
      delete gene.y;
    }
  }

  // calls _parseTrack on each track in the given microtracks
  private _parseTracks(source: string, tracks: MicroTracks): void {
    for (let i = 0; i < tracks.groups.length; i++) {
      const group = tracks.groups[i];
      this._parseTrack(source, group, i);
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

  // removes the query from given MicroTracks if present
  private _removeQuery(query: Group, tracks: MicroTracks): void {
    const genes = new Set(query.genes.map((g) => g.id));
    tracks.groups = tracks.groups.filter((group) => {
      return !group.genes.some((g) => genes.has(g.id));
    });
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
