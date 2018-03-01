// Angular
import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable } from "rxjs/Observable";
// store
import { Store } from "@ngrx/store";
import * as blockParamActions from "../actions/block-params.actions";
import * as macroTracksActions from "../actions/macro-tracks.actions";
import * as macroChromosomeActions from "../actions/macro-chromosome.actions";
import * as fromRoot from "../reducers";
import * as fromBlockParams from "../reducers/block-params.store";
import * as fromMacroChromosome from "../reducers/macro-chromosome.store";
import * as fromMacroTracks from "../reducers/macro-tracks.store";
import * as fromQueryParams from "../reducers/query-params.store";
import * as fromRouter from "../reducers/router.store";
import * as fromSearchQueryTrack from "../reducers/search-query-track.store";
// app
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { BlockParams } from "../models/block-params.model";
import { Group } from "../models/group.model";
import { MacroChromosome } from "../models/macro-chromosome.model";
import { MacroTrack } from "../models/macro-track.model";
import { MacroTracks } from "../models/macro-tracks.model";
import { GET, POST, Request, Server } from "../models/server.model";

@Injectable()
export class MacroTracksService {
  blockParams: Observable<BlockParams>;
  macroChromosome: Observable<any>;
  macroTracks: Observable<MacroTracks>;

  private searchRoute: Observable<any>;
  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient,
              private router: Router,
              private store: Store<fromRoot.State>) {

    // initialize observables
    this.blockParams = this.store.select(fromBlockParams.getBlockParams);
    this.macroChromosome = this.store.select(fromMacroChromosome.getMacroChromosome);
    this.macroTracks = this.store.select(fromMacroTracks.getMacroTracks);
    this.searchRoute = this.store.select(fromRouter.getSearchRoute);
    const macroChromosomeCorrelationId = this.store.select(fromMacroChromosome.getCorrelationID);
    const querySources = this.store.select(fromQueryParams.getQueryParamsSources);
    const routeParams = this.store.select(fromRouter.getParams);
    const searchQueryChromosome = this.store.select(fromSearchQueryTrack.getSearchQueryChromosome)
      .filter((chromosome) => chromosome !== undefined);
    const searchRouteSource = this.store.select(fromRouter.getSearchRouteSource);

    // subscribe to changes that initialize macro chromosome searches
    searchQueryChromosome
      .withLatestFrom(searchRouteSource)
      .subscribe(([chromosome, source]) => {
        const correlationID = Date.now();
        this.getChromosome(chromosome, source)
          .subscribe(
            (macroChromosome) => {
              const macroTracks = new MacroTracks();
              macroTracks.chromosome = chromosome;
              macroTracks.length = macroChromosome.length;
              macroTracks.tracks = [];
              this.store.dispatch(new macroTracksActions.New(correlationID, macroTracks));
              this.store.dispatch(new macroChromosomeActions.New(correlationID, macroChromosome));
            },
            (error) => {
              console.log(error);
              // TODO: throw error
            }
          );
      });

    // subscribe to changes that initialize macro searches
    Observable
      .combineLatest(this.macroChromosome, this.blockParams, querySources)
      .withLatestFrom(routeParams, macroChromosomeCorrelationId)
      .filter(([[chromosome, blockParams, sources], route, correlationID]) => {
        return chromosome !== undefined && route.gene !== undefined;
      })
      .subscribe(([[chromosome, blockParams, sources], route, correlationID]) => {
        this.federatedSearch(chromosome, blockParams, sources, correlationID)
          .subscribe(
            (macroTracks) => {
              this._parseTracks(chromosome, macroTracks);
              this.store.dispatch(new macroTracksActions.Add(correlationID, macroTracks));
            },
            (error) => {
              console.log(error);
              // TODO: throw error
            }
          );
      });
  }

  getChromosome(chromosome: string, serverID: string): Observable<MacroChromosome> {
    let source: Server;
    const i = this.serverIDs.indexOf(serverID);
    if (i > -1) {
      source = AppConfig.SERVERS[i];
    } else {
      return Observable.throw("\"" + serverID + "\" is not a valid server ID");
    }
    if (!source.hasOwnProperty("chromosome")) {
      return Observable.throw("\"" + serverID + "\" does not support chromosome queries");
    }
    const body = {chromosome};
    return this._makeRequest<MacroChromosome>(source.chromosome, body);
  }

  federatedSearch(
    chromosome: MacroChromosome,
    blockParams: BlockParams,
    serverIDs: string[],
    correlationID: number,
  ): Observable<MacroTrack[]> {
    // send a request for each server
    return Observable.merge(...serverIDs.map((serverID) => {
      return this.getMacroTracks(chromosome, blockParams, serverID);
    }));

  }

  getMacroTracks(
    chromosome: MacroChromosome,
    blockParams: BlockParams,
    serverID: string,
  ): Observable<MacroTrack[]> {
    let source: Server;
    const i = this.serverIDs.indexOf(serverID);
    if (i > -1) {
      source = AppConfig.SERVERS[i];
    } else {
      return Observable.throw("\"" + serverID + "\" is not a valid server ID");
    }
    if (!source.hasOwnProperty("macro")) {
      return Observable.throw("\"" + serverID + "\" does not support macro-track queries");
    }
    const body = {
      families: chromosome.families,
      intermediate: blockParams.bintermediate,
      mask: blockParams.bmask,
      matched: blockParams.bmatched,
    };
    return this._makeRequest<MacroTrack[]>(source.macro, body);
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
        // TODO: update this to use ngrx-router (requires @ngrx/effects)
        this.router.navigateByUrl(url);
      })
      // TODO: replace with .last() before subscribe
      .unsubscribe();
  }

  updateParams(params: BlockParams): void {
    this.store.dispatch(new blockParamActions.New(params));
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
  private _parseTracks(chromosome: MacroChromosome, tracks: MacroTrack[]): void {
    for (const track of tracks) {
      track.blocks = track.blocks.map((b) => {
        const start = chromosome.locations[b.query_start];
        const stop = chromosome.locations[b.query_stop];
        return {
          orientation: b.orientation,
          start: Math.min(start.fmin, start.fmax),
          stop: Math.max(stop.fmin, stop.fmax),
        };
      });
    }
  }
}
