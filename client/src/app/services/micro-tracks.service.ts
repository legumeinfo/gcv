// Angular
import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { Http, RequestOptionsArgs, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
// import { Store }                              from "@ngrx/store";

// App
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { StoreActions } from "../constants/store-actions";
import { argsByValue } from "../decorators/args-by-value.decorator";
import { AppStore } from "../models/app-store.model";
import { Family } from "../models/family.model";
import { Gene } from "../models/gene.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { QueryParams } from "../models/query-params.model";
import { GET, POST, Server } from "../models/server.model";
import { AppRouteService } from "./app-route.service";

@Injectable()
export class MicroTracksService extends AppRouteService {
  queryParams: Observable<QueryParams>;
  searchQueryTrack: Observable<Group>;
  microTracks: Observable<MicroTracks>;

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: Http,
              private location: Location,
              /*private _store: Store<AppStore>*/) {
    super(/*_store*/);

    // initialize observables
    // this.queryParams      = this._store.select("queryParams");
    // this.searchQueryTrack = this._store.select("searchQueryTrack");
    // this.microTracks      = this._store.select("microTracks");
    // let multiQueryGenes   = this._store.select<string[]>("multiQueryGenes");
    // let searchQueryGene   = this._store.select<any>("searchQueryGene");
    this.queryParams = Observable.empty<QueryParams>();
    this.searchQueryTrack = Observable.empty<Group>();
    this.microTracks = Observable.empty<MicroTracks>();
    const multiQueryGenes = Observable.empty<string[]>();
    const searchQueryGene = Observable.empty<any>();

    // subscribe to changes that initialize multi
    Observable
      .combineLatest(multiQueryGenes, this.queryParams)
      .filter(([queryGenes, params]) => {
        return this.route === AppRoutes.MULTI && queryGenes !== undefined;
      })
      .subscribe(([queryGenes, params]) => {
        this.multiQuery(queryGenes, params);
      });

    // subscribe to changes that initialize a gene search
    Observable
      .combineLatest(searchQueryGene, this.queryParams)
      .filter(([queryGene, params]) => {
        return this.route === AppRoutes.SEARCH && queryGene !== undefined;
      })
      .subscribe(([queryGene, params]) => {
        this.geneSearch(queryGene, params);
      });

    // subscribe to changes that initialize a track search
    Observable
      .combineLatest(this.searchQueryTrack, this.queryParams)
      .filter(([queryTrack, params]) => {
        return this.route === AppRoutes.SEARCH && queryTrack !== undefined;
      })
      .subscribe(([queryTrack, params]) => {
        this.trackSearch(queryTrack, params);
      });
  }

  @argsByValue()
  multiQuery(queryGenes: string[], params: QueryParams) {
    const args = {
      genes: queryGenes,
      neighbors: params.neighbors,
    } as RequestOptionsArgs;
    // send requests to the selected servers
    const requests: Array<Observable<Response>> = [];
    const sources = params.sources.reduce((l, s) => {
      const i = this.serverIDs.indexOf(s);
      if (i !== -1) {
        l.push(AppConfig.SERVERS[i]);
      }
      return l;
    }, []);
    for (const s of sources) {
      if (s.hasOwnProperty("microMulti")) {
        let response: Observable<Response>;
        if (s.microMulti.type === GET) {
          response = this.http.get(s.microMulti.url, args);
        } else {
          response = this.http.post(s.microMulti.url, args);
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
      const families: Family[] = [];
      const groups: Group[] = [];
      const maxLength: number = (params.neighbors * 2) + 1;
      for (let h = 0; h < results.length; ++h) {
        const result = results[h];
        const source = sources[h];
        if (result == null) {
          failed.push(source.id);
        } else {
          const tracks: MicroTracks = this._parseMicroTracksJSON(source, result);
          // center the tracks on the focus family
          const centers = [];
          for (const group of tracks.groups) {
            const genes: Gene[] = group.genes;
            let offset = 0;
            if (group.genes.length < maxLength) {
              for (let j = genes.length - 1; j >= 0; --j) {
                const g: Gene = genes[j];
                if (queryGenes.indexOf(g.name) !== -1) {
                  if (centers.indexOf(g.name) === -1) {
                    centers.push(g.name);
                    offset = params.neighbors - j;
                    break;
                  }
                }
              }
            }
            // set the gene positions relative to their track (group)
            for (let j = 0; j < genes.length; ++j) {
              const g: Gene = genes[j];
              g.x = offset + j;
              g.y = 0;
            }
          }
          // aggregate
          families.push.apply(families, tracks.families);
          groups.push.apply(groups, tracks.groups);
        }
      }
      const aggregateTracks = new MicroTracks(families, groups);
      this._idTracks(aggregateTracks);
      // let action = {
      //   type: StoreActions.ADD_MICRO_TRACKS,
      //   payload: aggregateTracks
      // };
      // this._store.dispatch(action);
    });
  }

  @argsByValue()
  geneSearch(queryGene: any, params: QueryParams): void {
    // fetch query track for gene
    const idx: number = this.serverIDs.indexOf(queryGene.source);
    if (idx !== -1) {
      const s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty("microQuery")) {
        const args = {
          gene: queryGene.gene,
          neighbors: params.neighbors,
        } as RequestOptionsArgs;
        let response: Observable<Response>;
        if (s.microQuery.type === GET) {
          response = this.http.get(s.microQuery.url, args);
        } else {
          response = this.http.post(s.microQuery.url, args);
        }
        response.map((res) => JSON.parse(res.json())).subscribe((query) => {
          this._prepareTrack(queryGene.source, query);
          // this._query.next(query);
          // let action = {
          //   type: StoreActions.NEW_SEARCH_QUERY_TRACK,
          //   payload: query
          // };
          // this._store.dispatch(action);
        }, (e) => {
          // this.location.back();
        });
      }
    }
  }

  @argsByValue()
  trackSearch(query: Group, params: QueryParams): void {
    const args = {
      intermediate: params.intermediate,
      matched: params.matched,
      query: query.genes.map((g) => g.family),
    } as RequestOptionsArgs;
    // send requests to the selected servers
    const requests: Array<Observable<Response>> = [];
    const sources = params.sources.reduce((l, s) => {
      const i = this.serverIDs.indexOf(s);
      if (i !== -1) {
        l.push(AppConfig.SERVERS[i]);
      }
      return l;
    }, []);
    for (const s of sources) {
      if (s.hasOwnProperty("microSearch")) {
        let response: Observable<Response>;
        if (s.microSearch.type === GET) {
          response = this.http.get(s.microSearch.url, args);
        } else {
          response = this.http.post(s.microSearch.url, args);
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
      const families: Family[] = [];
      const groups: Group[] = [query];
      const geneIDs = query.genes.map((g) => g.id);
      for (let i = 0; i < results.length; ++i) {
        const result = results[i];
        const source = sources[i];
        if (result == null) {
          failed.push(source.id);
        } else {
          const tracks: MicroTracks = this._parseMicroTracksJSON(source, result);
          // remove tracks that overlap with the query
          if (source.id === query.source) {
            tracks.groups = tracks.groups.filter((group ) => {
              if (group.species_id === query.species_id
              && group.chromosome_id === query.chromosome_id) {
                return !group.genes.some((g) => geneIDs.indexOf(g.id) !== -1);
              }
              return true;
            });
          }
          // aggregate the remaining tracks
          families.push.apply(families, tracks.families);
          groups.push.apply(groups, tracks.groups);
        }
      }
      const aggregateTracks = new MicroTracks(families, groups);
      this._idTracks(aggregateTracks);
      // let action = {
      //   type: StoreActions.ADD_MICRO_TRACKS,
      //   payload: aggregateTracks
      // };
      // this._store.dispatch(action);
    });
  }

  @argsByValue()
  updateParams(params: QueryParams): void {
    // let action = {type: StoreActions.UPDATE_QUERY_PARAMS, payload: params};
    // this._store.dispatch(action);
  }

  private _prepareTrack(source: string, track: Group): void {
    track.source = source;
    for (let j = 0; j < track.genes.length; ++j) {
      const gene: Gene = track.genes[j];
      gene.source = source;
      gene.x = j;
      gene.y = 0;
    }
  }

  private _parseMicroTracksJSON(source: Server, json: any): MicroTracks {
    const tracks: MicroTracks = JSON.parse(json);
    // combine overlapping tracks
    const mergeTracks = (toMerge) => {
      const merged = toMerge[0];
      const seen = new Set(merged.genes.map((g) => g.id));
      for (let i = 1; i < toMerge.length; i++) {
        for (let j = 0; j < toMerge[i].genes; j++) {
          const g = toMerge[i].genes[j];
          if (!seen.has(g.id)) {
            seen.add(g.id);
            merged.genes.push(g);
          }
        }
      }
      return merged;
    };
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
            groups.push(mergeTracks(toMerge));
            toMerge = [];
          }
        }
      } else {
        groups.push(bin[0]);
      }
    }
    tracks.groups = groups;
    // assign initial coordinates
    for (const group of tracks.groups) {
      this._prepareTrack(source.id, group);
    }
    return tracks;
  }

  private _idTracks(tracks: MicroTracks): void {
    for (let i = 0; i < tracks.groups.length; ++i) {
      tracks.groups[i].id = i;
    }
  }
}
