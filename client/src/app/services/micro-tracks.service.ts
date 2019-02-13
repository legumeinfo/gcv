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
import * as fromMicroTracks from "../store/reducers/micro-tracks.store";
import * as fromRouter from "../store/reducers/router.store";
import * as fromSearchQueryTrack from "../store/reducers/search-query-track.store";
// app
import { Group, MicroTracks, QueryParams } from "../models";
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
    this.microTracks = store.select(fromMicroTracks.getMicroTracks);
    this.queryParams = store.select(fromRouter.getMicroQueryParams);
    this.searchQueryTrack = store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .pipe(filter((queryTrack) => queryTrack !== undefined));
    this.routeParams = store.select(fromRouter.getParams);
  }

  // fetches multi tracks for the given genes from the given source
  getMultiTracks(genes: string[], neighbors: number, serverID: string): Observable<MicroTracks> {
    const body = {genes, neighbors};
    return this._makeRequest<MicroTracks<{}, {}, PointMixin>>(serverID, "microMulti", body).pipe(
      map((tracks) => {
        this._mergeOverlappingTracks(tracks);
        this._parseTracks(serverID, tracks);
        return tracks;
      }),
      catchError((error) => throwError(error)),
    )
  }

  // gets a macro tracks for each server provided
  getFederatedMultiTracks(
    query: string[],
    neighbors: number,
    serverIDs: string[],
  ): Observable<[string, MicroTracks]> {
    return merge(onErrorResumeNext(...serverIDs.map((serverID) => {
      return this.getMultiTracks(query, neighbors, serverID).pipe(
        map((tracks): [string, MicroTracks] => [serverID, tracks]),
        catchError((error) => throwError([serverID, error])),
      );
    })));
  }

  // fetches a query track for the given gene from the given source
  getQueryTrack(gene: string, neighbors: number, serverID: string): Observable<Group> {
    const body = {gene, neighbors: String(neighbors)};
    return this._makeRequest<Group<PointMixin>>(serverID, "microQuery", body).pipe(
      map((track) => {
        this._parseTrack(serverID, track);
        return track;
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

  // performs a micro track search for each server provided
  getFederatedSearchTracks(
    query: Group,
    params: QueryParams,
    serverIDs: string[]
  ): Observable<[string, MicroTracks]> {
    return merge(onErrorResumeNext(...serverIDs.map((serverID) => {
      return this.getSearchTracks(query, params, serverID).pipe(
        map((tracks): [string, MicroTracks] => [serverID, tracks]),
        catchError((error) => throwError([serverID, error])),
      );
    })));
  }

  // takes a span for a specific chromosome and retrieves the relevant search
  // (query gene and neighbors)
  getSearchFromSpan(
    chromosome: string,
    begin: number,
    end: number,
    serverID: string):
  Observable<{gene: string, neighbors: number}> {
    const body = {
      chromosome,
      begin: String(begin),
      end: String(end),
    };
    return this._makeRequest<{gene: string, neighbors: number}>(serverID, "spanToSearch", body)
      .pipe(catchError((error) => throwError(error)));
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
