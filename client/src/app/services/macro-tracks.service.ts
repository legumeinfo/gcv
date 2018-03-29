// Angular
import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { _throw } from "rxjs/observable/throw";
import { catchError, map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../actions/router.actions";
import * as fromRoot from "../reducers";
import * as fromMacroChromosome from "../reducers/macro-chromosome.store";
import * as fromMacroTracks from "../reducers/macro-tracks.store";
import * as fromMultiMacroTracks from "../reducers/multi-macro-tracks.store";
import * as fromRouter from "../reducers/router.store";
// app
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { BlockParams } from "../models/block-params.model";
import { MacroChromosome } from "../models/macro-chromosome.model";
import { MacroTrack } from "../models/macro-track.model";
import { MacroTracks } from "../models/macro-tracks.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class MacroTracksService {
  blockParams: Observable<BlockParams>;
  macroChromosome: Observable<any>;
  macroTracks: Observable<MacroTracks>;
  multiMacroTracks: Observable<MacroTracks[]>;
  macroChromosomeLoadState: Observable<any>;
  macroTracksLoadState: Observable<any>;

  requests: Observable<[any, Observable<any>]>;
  private requestsSubject = new BehaviorSubject<[any, Observable<any>]>(undefined);

  private searchRoute: Observable<any>;
  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient, private store: Store<fromRoot.State>) {
    this.requests = this.requestsSubject.asObservable()
      .filter((request) => request !== undefined);
    // initialize observables
    this.blockParams = store.select(fromRouter.getMacroBlockParams);
    this.macroChromosome = store.select(fromMacroChromosome.getMacroChromosome);
    this.macroTracks = store.select(fromMacroTracks.getMacroTracks);
    this.multiMacroTracks = store.select(fromMultiMacroTracks.getMultiMacroTracks);
    this.searchRoute = store.select(fromRouter.getSearchRoute);
    this.macroChromosomeLoadState = store.select(fromMacroChromosome.getMacroChromosomeLoadState);
    this.macroTracksLoadState = store.select(fromMacroTracks.getMacroTracksLoadState);
  }

  getChromosome(chromosome: string, serverID: string): Observable<MacroChromosome> {
    const body = {chromosome};
    return this._makeRequest<MacroChromosome>(serverID, "chromosome", body).pipe(
      map((macroChromosome) => {
        macroChromosome.name = chromosome;
        return macroChromosome;
      }),
      catchError((error) => _throw(error)),
    );
  }

  getChromosomes(
    chromosomes: {name: string, genus: string, species: string}[],
    serverID: string
  ): Observable<[{name: string, genus: string, species: string}, MacroChromosome]> {
    return Observable.merge(...chromosomes.map((chromosome) => {
      return this.getChromosome(chromosome.name, serverID).pipe(
        map((result): [{name: string, genus: string, species: string}, MacroChromosome] => {
          return [chromosome, result];
        }),
        catchError((error) => _throw(error)),
      );
    }));
  }

  getMacroTracks(
    chromosome: MacroChromosome,
    blockParams: BlockParams,
    serverID: string,
    targets: string[] = [],
  ): Observable<MacroTrack[]> {
    const body = {
      families: chromosome.families,
      intermediate: blockParams.bintermediate,
      mask: blockParams.bmask,
      matched: blockParams.bmatched,
      targets,
    };
    return this._makeRequest<MacroTrack[]>(serverID, "macro", body).pipe(
      map((macroTracks) => {
        this._parseTracks(chromosome, macroTracks);
        return macroTracks;
      }),
      catchError((error) => _throw(error)),
    );
  }

  getFederatedMacroTracks(
    chromosome: MacroChromosome,
    blockParams: BlockParams,
    serverIDs: string[],
    targets: string[] = [],
  ): Observable<[string, MacroTrack[]]> {
    // send a request for each server
    return Observable.merge(...serverIDs.map((serverID) => {
      return this.getMacroTracks(chromosome, blockParams, serverID, targets).pipe(
        map((tracks) => [serverID, tracks]),
        catchError((error) => _throw([serverID, error])),
      );
    }));
  }

  // finds the nearest gene on the query chromosome and pushes it to the store
  // TODO: add source to macroChromosome so route isns't needed
  nearestGene(position: number): void {
    // get the current search query gene and macro-synteny query chromosome
    Observable
      .combineLatest(this.searchRoute, this.macroChromosome)
      .subscribe(([route, chromosome]) => {
        const locations = chromosome.locations;
        const genes = chromosome.genes;
        // find the closest gene via binary search
        let lo = 0;
        let hi = locations.length - 1;
        let mid: number;
        while (lo < hi) {
          mid = Math.floor((lo + hi) / 2);
          const loc = locations[mid];
          if (loc.fmin < position && loc.fmax < position) {
            lo = mid + 1;
          } else if (loc.fmin > position && loc.fmax > position) {
            hi = mid;
          } else {
            break;
          }
        }
        // navigate to the new gene in the url
        const url = "/" + AppRoutes.SEARCH +
                    "/" + route.source +
                    "/" + genes[mid];
        this.store.dispatch(new routerActions.Go({path: [url, { routeParam: 1 }]}));
      })
      // TODO: replace with .last() before subscribe
      .unsubscribe();
  }

  updateParams(params: BlockParams): void {
    const path = [];
    const query = Object.assign({}, params);
    this.store.dispatch(new routerActions.Go({path, query}));
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
  private _parseTracks(chromosome: MacroChromosome, tracks: MacroTrack[]): void {
    for (const track of tracks) {
      track.blocks = track.blocks.map((b) => {
        const start = chromosome.locations[b.query_start];
        const stop = chromosome.locations[b.query_stop];
        return {
          orientation: b.orientation,
          start: b.start,
          stop: b.stop,
          query_start: Math.min(start.fmin, start.fmax),
          query_stop: Math.max(stop.fmin, stop.fmax),
        };
      });
    }
  }
}
