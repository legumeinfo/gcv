// Angular
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, merge, onErrorResumeNext, throwError } from "rxjs";
import { catchError, filter, map } from "rxjs/operators";
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../store/actions/router.actions";
import * as fromRoot from "../store/reducers";
import * as fromMacroChromosome from "../store/reducers/macro-chromosome.store";
import * as fromMacroTracks from "../store/reducers/macro-tracks.store";
import * as fromMultiMacroTracks from "../store/reducers/multi-macro-tracks.store";
import * as fromRouter from "../store/reducers/router.store";
// app
import { BlockParams, MacroChromosome, MacroTrack, MacroTracks } from "../models";
import { HttpService } from "./http.service";

@Injectable()
export class MacroTracksService extends HttpService {
  blockParams: Observable<BlockParams>;
  macroChromosome: Observable<any>;
  macroTracks: Observable<MacroTracks>;
  multiMacroTracks: Observable<MacroTracks[]>;
  macroChromosomeLoadState: Observable<any>;
  macroTracksLoadState: Observable<any>;

  private searchRoute: Observable<any>;

  constructor(private _http: HttpClient, private store: Store<fromRoot.State>) {
    super(_http);
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
      catchError((error) => throwError(error)),
    );
  }

  getChromosomes(
    chromosomes: {name: string, genus: string, species: string}[],
    serverID: string
  ): Observable<[{name: string, genus: string, species: string}, MacroChromosome]> {
    return merge(onErrorResumeNext(...chromosomes.map((chromosome) => {
      return this.getChromosome(chromosome.name, serverID).pipe(
        map((result): [{name: string, genus: string, species: string}, MacroChromosome] => {
          return [chromosome, result];
        }),
        catchError((error) => throwError(error)),
      );
    })));
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
      catchError((error) => throwError(error)),
    );
  }

  getFederatedMacroTracks(
    chromosome: MacroChromosome,
    blockParams: BlockParams,
    serverIDs: string[],
    targets: string[] = [],
  ): Observable<[string, MacroTrack[]]> {
    // send a request for each server
    return merge(onErrorResumeNext(...serverIDs.map((serverID) => {
      return this.getMacroTracks(chromosome, blockParams, serverID, targets).pipe(
        map((tracks): [string, MacroTrack[]] => [serverID, tracks]),
        catchError((error) => throwError([serverID, error])),
      );
    })));
  }

  // finds the nearest gene on the query chromosome and pushes it to the store
  // TODO: add source to macroChromosome so route isns't needed
  nearestGene(position: number): void {
    // get the current search query gene and macro-synteny query chromosome
    combineLatest(this.searchRoute, this.macroChromosome)
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
        const url = "/search" +
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
