// Angular
import { Http, RequestOptionsArgs, Response } from '@angular/http';
import { Injectable }                         from '@angular/core';
import { Observable }                         from 'rxjs/Observable';
import { Router }                             from '@angular/router';
import { Store }                              from '@ngrx/store';

// App
import { AppConfig }         from '../app.config';
import { AppRoutes }         from '../constants/app-routes';
import { AppRouteService }   from './app-route.service';
import { BlockParams }       from '../models/block-params.model';
import { StoreActions }      from '../constants/store-actions';
import { AppStore }          from '../models/app-store.model';
import { GET, POST, Server } from '../models/server.model';
import { Group }             from '../models/group.model';
import { MicroTracks }       from '../models/micro-tracks.model';
import { MacroTracks }       from '../models/macro-tracks.model';
import { QueryParams }       from '../models/query-params.model';

@Injectable()
export class MacroTracksService extends AppRouteService {
  blockParams: Observable<BlockParams>;
  macroChromosome: Observable<any>;
  macroTracks: Observable<MacroTracks>;

  private _searchQueryGene: Observable<any>;
  private _serverIDs   = AppConfig.SERVERS.map(s => s.id);

  constructor(private _http: Http,
              private _router: Router,
              private _store: Store<AppStore>) {
    super(_store);

    // initialize observables
    this.blockParams      = this._store.select('blockParams');
    this.macroChromosome  = this._store.select('macroChromosome');
    this.macroTracks      = this._store.select('macroTracks');
    this._searchQueryGene = this._store.select('searchQueryGene');
    let searchQueryTrack  = this._store.select<Group>('searchQueryTrack');
    let queryParams       = this._store.select<QueryParams>('queryParams');

    // subscribe to changes that initialize macro chromosome searches
    searchQueryTrack
      .filter(track => this._route == AppRoutes.SEARCH && track !== undefined)
      .subscribe(track => this.getChromosome(track));

    // subscribe to changes that initialize macro searches
    Observable
      .combineLatest(this.macroChromosome, this.blockParams, queryParams)
      .filter(([chromosome, blockParams, queryParams]) => {
        return this._route == AppRoutes.SEARCH && chromosome !== undefined;
      })
      .subscribe(([chromosome, blockParams, queryParams]) => {
        this.federatedSearch(chromosome, blockParams, queryParams);
      });
  }

  getChromosome(queryTrack: Group): void {
    // fetch query track for gene
    let idx: number = this._serverIDs.indexOf(queryTrack.source);
    if (idx != -1) {
      let s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty('chromosome')) {
        let args = {chromosome: queryTrack.chromosome_name} as RequestOptionsArgs;
        let response: Observable<Response>;
        if (s.chromosome.type === GET)
          response = this._http.get(s.chromosome.url, args)
        else
          response = this._http.post(s.chromosome.url, args)
        response.map(res => res.json()).subscribe(query => {
          //success(query);
          let action = {
            type: StoreActions.NEW_MACRO_CHROMOSOME,
            payload: query
          };
          this._store.dispatch(action);
        });
        //, failure);
      } else {
        //failure(s.id + " doesn't serve chromosome requests");
      }
    } else {
      //failure('invalid source: ' + source);
    }
  }

  federatedSearch(chromosome: any, blockParams: BlockParams,
  queryParams: QueryParams): void {
    let sources = queryParams.sources.reduce((l, s) => {
      let i = this._serverIDs.indexOf(s);
      if (i != -1) l.push(AppConfig.SERVERS[i]);
      //else failure('invalid source: ' + s);
      return l;
    }, []);
    //if (!this._checkSetCache(name, sources)) {
      this._store.dispatch({type: StoreActions.ADD_MACRO_TRACKS,
        payload: undefined});
      let args = {
        families: chromosome.families,
        matched: blockParams.bmatched,
        intermediate: blockParams.bintermediate,
        mask: blockParams.bmask
      } as RequestOptionsArgs;
		  // send requests to the selected servers
      let requests: Observable<Response>[] = [];
      for (let i = 0; i < sources.length; ++i) {
        let s: Server = sources[i];
        if (s.hasOwnProperty('macro')) {
          let response: Observable<Response>;
          if (s.macro.type === GET)
            response = this._http.get(s.macro.url, args);
          else
            response = this._http.post(s.macro.url, args);
          requests.push(response
            .map(res => res.json())
            .catch(() => Observable.empty())
            .defaultIfEmpty(null));
        } else {
          //failure(s.id + " doesn't serve macro track requests");
        }
      }
      // aggregate the results
      Observable.forkJoin(requests).subscribe(results => {
        let failed = [];
        //let macro = undefined;
        let macro = {
          chromosome: 'name',
          length:     chromosome.length,
          tracks:     []
        };
        for (let i = 0; i < results.length; ++i) {
          let tracks = <any>results[i];
          let source = sources[i];
          if (tracks == null) {
            failed.push(source.id);
          } else {
            for (let i = 0; i < tracks.length; ++i) {
              tracks[i].blocks = tracks[i].blocks.map(b => {
                let start = chromosome.locations[b.query_start],
                    stop  = chromosome.locations[b.query_stop];
                return {
                  start:       Math.min(start.fmin, start.fmax),
                  stop:        Math.max(stop.fmin, stop.fmax),
                  orientation: b.orientation
                };
              });
            }
            macro.tracks.push.apply(macro.tracks, tracks);
          }
        }
        //if (failed.length > 0)
        //  failure('failed to retrieve data from sources: ' + failed.join(', '));
        let action = {type: StoreActions.ADD_MACRO_TRACKS, payload: macro};
        this._store.dispatch(action);
      });
    //}
  }

  search(tracks: MicroTracks, params: QueryParams, failure = e => {}): void {
    if (tracks.groups.length > 0) {
      //let query = tracks.groups[0];
      //let sources = params.sources.reduce((l, s) => {
      //  let i = this._serverIDs.indexOf(s);
      //  if (i != -1) l.push(AppConfig.SERVERS[i]);
      //  else failure('invalid source: ' + s);
      //  return l;
      //}, []);
      //if (!this._checkSetCache(query.chromosome_name, sources)) {
      //  this._store.dispatch({type: StoreActions.ADD_MACRO_TRACKS,
      //    payload: undefined});
      //  let args = {
      //    chromosome: query.chromosome_name
      //  } as RequestOptionsArgs;
		  //  // send requests to the selected servers
      //  let requests: Observable<Response>[] = [];
      //  for (let i = 0; i < sources.length; ++i) {
      //    let s: Server = sources[i];
      //    if (s.hasOwnProperty('macro')) {
      //      let response: Observable<Response>;
      //      if (s.macro.type === GET)
      //        response = this._http.get(s.macro.url, args);
      //      else
      //        response = this._http.post(s.macro.url, args);
      //      requests.push(response
      //        .map(res => res.json())
      //        .catch(() => Observable.empty())
      //        .defaultIfEmpty(null));
      //    } else {
      //      failure(s.id + " doesn't serve macro track requests");
      //    }
      //  }
      //  // aggregate the results
      //  Observable.forkJoin(requests).subscribe(results => {
      //    let failed = [];
      //    let macro = undefined;
      //    for (let i = 0; i < results.length; ++i) {
      //      let result = <any>results[i];
      //      let source = sources[i];
      //      if (result == null) {
      //        failed.push(source.id);
      //      } else {
      //        // aggregate the tracks
      //        if (macro === undefined) {
      //          macro = result;
      //        } else {
      //          macro.tracks.push.apply(macro.tracks, result.tracks);
      //          if (macro.length === null) {
      //            macro.length = result.length;
      //            //safest to assume that the service that knows the length
      //            //should also have the say on the chromosome_id
      //            macro.chromosome_id = result.chromosome_id;
      //          }
      //        }
      //      }
      //    }
      //    if (failed.length > 0)
      //      failure('failed to retrieve data from sources: ' + failed.join(', '));
      //    this._store.dispatch({type: StoreActions.ADD_MACRO_TRACKS,
      //      payload: macro});
      //  });
      //}
    }
    failure("no micro tracks provided");
  }

  // finds the nearest gene on the query chromosome and pushes it to the store
  nearestGene(position: number): void {
    // get the current search query gene and macro-synteny query chromosome
    Observable
      .combineLatest(this._searchQueryGene, this.macroChromosome)
      .subscribe(([queryGene, chromosome]) => {
        let locations = chromosome.locations,
            genes     = chromosome.genes;
        // find the closest gene via binary search
        let lo = 0,
            hi = locations.length - 1,
            mid: number;
        while (lo < hi) {
          mid = Math.floor((lo + hi) / 2);
          let loc = locations[mid];
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
        let url = '/' + AppRoutes.SEARCH +
                  '/' + queryGene.source +
                  '/' + queryGene.gene;
        this._router.navigateByUrl(url);
      })
      .unsubscribe();
  }

  updateParams(params: BlockParams): void {
    let action = {type: StoreActions.UPDATE_BLOCK_PARAMS, payload: params};
    this._store.dispatch(action);
  }
}
