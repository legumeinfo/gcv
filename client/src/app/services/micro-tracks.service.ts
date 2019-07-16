// Angular
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, combineLatest, merge, onErrorResumeNext, throwError } from "rxjs";
import { catchError, filter, map, take } from "rxjs/operators";
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../store/actions/router.actions";
import * as fromRoot from "../store/reducers";
import * as fromMacroChromosome from "../store/reducers/macro-chromosome.store";
import * as fromRouter from "../store/reducers/router.store";
import * as fromSearchQueryTrack from "../store/reducers/search-query-track.store";
// app
import { AppConfig } from "../app.config";
import { Group, MicroTracks, QueryParams, Track } from "../models";
import { PointMixin } from "../models/mixins";
import { HttpService } from "./http.service";

@Injectable()
export class MicroTracksService extends HttpService {
  microTracks: Observable<MicroTracks>;
  queryParams: Observable<QueryParams>;
  routeParams: Observable<any>;
  searchQueryTrack: Observable<Group>;

  constructor(private _http: HttpClient, private store: Store<fromRoot.State>) {
    super(_http);
    // initialize observables
    //this.microTracks = store.select(fromMicroTracks.getMicroTracks);
    this.queryParams = store.select(fromRouter.getMicroQueryParams);
    this.searchQueryTrack = store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .pipe(filter((queryTrack) => queryTrack !== undefined));
    this.routeParams = store.select(fromRouter.getParams);
  }

  microTracksSearch(families: string[], params: QueryParams, serverID: string):
  Observable<Track[]> {
    const body = {
      intermediate: String(params.intermediate),
      matched: String(params.matched),
      query: families,
    };
    return this._makeRequest<{tracks: Track[]}>(serverID, "microSearch", body).pipe(
      map(({tracks}) => {
        return tracks;
      }),
      catchError((error) => throwError(error)),
    );
  }

  // performs a micro track search for the given query track and params
  getSearchTracks(query: Group, params: QueryParams, serverID: string): Observable<MicroTracks> {
    const body = {
      intermediate: String(params.intermediate),
      matched: String(params.matched),
      query: query.genes.map((g) => g.family),
    };
    return this._makeRequest<MicroTracks<{}, {}, PointMixin>>(serverID, "microSearch", body).pipe(
      map((tracks) => {
        this._removeQuery(query, tracks);
        this._mergeOverlappingTracks(tracks);
        this._parseTracks(serverID, tracks);
        return tracks;
      }),
      catchError((error) => throwError(error)),
    );
  }

  updateParams(params: QueryParams): void {
    const path = [];
    const query = Object.assign({}, params, {sources: params.sources.join(",")});
    this.store.dispatch(new routerActions.Go({path, query}));
  }

  scroll(step: number): Observable<any> {
    return Observable.create((observer) => {
      combineLatest(
        this.routeParams,
        this.store.select(fromMacroChromosome.getMacroChromosome))
      .pipe(take(1))
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

  spanSearch(chromosome: string, low: number, high: number): void {
    // search the default (first) server for now
    const source = AppConfig.SERVERS[0].id;
    const url = "/search" +
          "/" + source +
          "/" + chromosome +
          "/" + low + "-" + high;
    this.store.dispatch(new routerActions.Go({path: [url, { routeParam: 1 }]}));
  }

  // adds the server id the track came from to the track and its genes
  private _parseTrack(source: string, track: Group<PointMixin>, i: number = -1): void {
    track.source = source;
    track.id = source + i;
    for (const gene of track.genes) {
      gene.source = source;
      delete gene.x;
      delete gene.y;
    }
  }

  // calls _parseTrack on each track in the given microtracks
  private _parseTracks(source: string, tracks: MicroTracks<{}, {}, PointMixin>): void {
    for (let i = 0; i < tracks.groups.length; i++) {
      const group = tracks.groups[i];
      this._parseTrack(source, group, i);
    }
  }

  // merges all the groups in the given array into a single group
  private _mergeTracks(toMerge: Group[]): Group {
    const merged: Group = Object.assign({}, toMerge[0]);
    //merged.genes = toMerge[0].genes.slice();
    //const seen = new Set(merged.genes.map((g) => g.id));
    //for (let i = 1; i < toMerge.length; i++) {
    //  for (const g of toMerge[i].genes) {
    //    if (!seen.has(g.id)) {
    //      seen.add(g.id);
    //      merged.genes.push(g);
    //    }
    //  }
    //}
    return merged;
  }

  // removes the query from given MicroTracks if present
  private _removeQuery(query: Group, tracks: MicroTracks): void {
    //const genes = new Set(query.genes.map((g) => g.id));
    //tracks.groups = tracks.groups.filter((group) => {
    //  return !group.genes.some((g) => genes.has(g.id));
    //});
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
