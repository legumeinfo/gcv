// Angular
import { Injectable } from "@angular/core";
import { Http, RequestOptionsArgs, Response } from "@angular/http";
import { Router } from "@angular/router";
import { Observable } from "rxjs/Observable";
// import { Store } from "@ngrx/store";

// App
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { StoreActions } from "../constants/store-actions";
import { AppStore } from "../models/app-store.model";
import { BlockParams } from "../models/block-params.model";
import { Group } from "../models/group.model";
import { MacroTracks } from "../models/macro-tracks.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { QueryParams } from "../models/query-params.model";
import { GET, POST, Server } from "../models/server.model";
import { AppRouteService } from "./app-route.service";

@Injectable()
export class MacroTracksService extends AppRouteService {
  blockParams: Observable<BlockParams>;
  macroChromosome: Observable<any>;
  macroTracks: Observable<MacroTracks>;

  private searchQueryGene: Observable<any>;
  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: Http,
              private router: Router,
              /*private _store: Store<AppStore>*/) {
    super(/*_store*/);

    // initialize observables
    // this.blockParams      = this._store.select("blockParams");
    // this.macroChromosome  = this._store.select("macroChromosome");
    // this.macroTracks      = this._store.select("macroTracks");
    // this.searchQueryGene = this._store.select("searchQueryGene");
    // let searchQueryTrack  = this._store.select<Group>("searchQueryTrack");
    // let queryParams       = this._store.select<QueryParams>("queryParams");
    this.blockParams      = Observable.empty<BlockParams>();
    this.macroChromosome  = Observable.empty<any>();
    this.macroTracks      = Observable.empty<MacroTracks>();
    this.searchQueryGene = Observable.empty<any>();
    const searchQueryTrack  = Observable.empty<Group>();
    const queryParams       = Observable.empty<QueryParams>();

    // subscribe to changes that initialize macro chromosome searches
    searchQueryTrack
      .filter((track) => this.route === AppRoutes.SEARCH && track !== undefined)
      .subscribe((track) => this.getChromosome(track));

    // subscribe to changes that initialize macro searches
    Observable
      .combineLatest(this.macroChromosome, this.blockParams, queryParams)
      .filter(([chromosome, blockParams, queryParams]) => {
        return this.route === AppRoutes.SEARCH && chromosome !== undefined;
      })
      .subscribe(([chromosome, blockParams, queryParams]) => {
        this.federatedSearch(chromosome, blockParams, queryParams);
      });
  }

  getChromosome(queryTrack: Group): void {
    // fetch query track for gene
    const idx: number = this.serverIDs.indexOf(queryTrack.source);
    if (idx !== -1) {
      const s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty("chromosome")) {
        const args = {chromosome: queryTrack.chromosome_name} as RequestOptionsArgs;
        let response: Observable<Response>;
        if (s.chromosome.type === GET) {
          response = this.http.get(s.chromosome.url, args);
        } else {
          response = this.http.post(s.chromosome.url, args);
        }
        response.map((res) => res.json()).subscribe((query) => {
          // success(query);
          // let action = {
          //   type: StoreActions.NEW_MACRO_CHROMOSOME,
          //   payload: query
          // };
          // this._store.dispatch(action);
        });
      }
    }
  }

  federatedSearch(chromosome: any, blockParams: BlockParams,
                  queryParams: QueryParams): void {
    const sources = queryParams.sources.reduce((l, s) => {
      const i = this.serverIDs.indexOf(s);
      if (i !== -1) {
        l.push(AppConfig.SERVERS[i]);
      }
      return l;
    }, []);
    const args = {
      families: chromosome.families,
      intermediate: blockParams.bintermediate,
      mask: blockParams.bmask,
      matched: blockParams.bmatched,
    } as RequestOptionsArgs;
    // send requests to the selected servers
    const requests: Array<Observable<Response>> = [];
    for (const s of sources) {
      if (s.hasOwnProperty("macro")) {
        let response: Observable<Response>;
        if (s.macro.type === GET) {
          response = this.http.get(s.macro.url, args);
        } else {
          response = this.http.post(s.macro.url, args);
        }
        requests.push(response
          .map((res) => res.json())
          .catch(() => Observable.empty())
          .defaultIfEmpty(null));
      }
    }
    // aggregate the results
    Observable.forkJoin(requests).subscribe((results) => {
      const failed = [];
      const macro = {
        chromosome: "name",
        length: chromosome.length,
        tracks: [],
      };
      for (let i = 0; i < results.length; ++i) {
        const tracks: any = results[i];
        const source = sources[i];
        if (tracks == null) {
          failed.push(source.id);
        } else {
          for (const track of tracks) {
            track.blocks = track.blocks.map((b) => {
              const start = chromosome.locations[b.query_start];
              const stop  = chromosome.locations[b.query_stop];
              return {
                orientation: b.orientation,
                start: Math.min(start.fmin, start.fmax),
                stop: Math.max(stop.fmin, stop.fmax),
              };
            });
          }
          macro.tracks.push.apply(macro.tracks, tracks);
        }
      }
      // let action = {type: StoreActions.ADD_MACRO_TRACKS, payload: macro};
      // this._store.dispatch(action);
    });
  }

  // finds the nearest gene on the query chromosome and pushes it to the store
  nearestGene(position: number): void {
    // get the current search query gene and macro-synteny query chromosome
    Observable
      .combineLatest(this.searchQueryGene, this.macroChromosome)
      .subscribe(([queryGene, chromosome]) => {
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
        queryGene.gene = genes[mid];
        // navigate to the new gene in the url
        const url = "/" + AppRoutes.SEARCH +
                    "/" + queryGene.source +
                    "/" + queryGene.gene;
        this.router.navigateByUrl(url);
      })
      .unsubscribe();
  }

  updateParams(params: BlockParams): void {
    // let action = {type: StoreActions.UPDATE_BLOCK_PARAMS, payload: params};
    // this._store.dispatch(action);
  }
}
