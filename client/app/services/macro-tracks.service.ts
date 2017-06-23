// Angular
import { Http, Response } from '@angular/http';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Store }          from '@ngrx/store';

// App
import { AppConfig }         from '../app.config';
import { ADD_MACRO_TRACKS }  from '../constants/actions';
import { AppStore }          from '../models/app-store.model';
import { GET, POST, Server } from '../models/server.model';
import { MicroTracks }       from '../models/micro-tracks.model';
import { MacroTracks }       from '../models/macro-tracks.model';
import { QueryParams }       from '../models/query-params.model';

@Injectable()
export class MacroTracksService {
  tracks: Observable<MacroTracks>;

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  constructor(private _http: Http, private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.tracks = this._store.select('macroTracks');
  }

  search(tracks: MicroTracks, params: QueryParams, failure = e => {}): void {
    if (tracks.groups.length > 0) {
      this._store.dispatch({type: ADD_MACRO_TRACKS, payload: undefined})
      let query = tracks.groups[0];
      let args = {
        chromosome: query.chromosome_name
      };
		  // send requests to the selected servers
      let requests: Observable<Response>[] = [];
      let sources = params.sources.reduce((l, s) => {
        let i = this._serverIDs.indexOf(s);
        if (i != -1) l.push(AppConfig.SERVERS[i]);
        else failure('invalid source: ' + s);
        return l;
      }, []);
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
          failure(s.id + " doesn't serve basic micro track requests");
        }
      }
      // aggregate the results
      Observable.forkJoin(requests).subscribe(results => {
        let failed = [];
        let macro = undefined;
        for (let i = 0; i < results.length; ++i) {
          let result = <any>results[i];
          let source = sources[i];
          if (result == null) {
            failed.push(source.id);
          } else {
            // aggregate the tracks
            if (macro === undefined) {
              macro = result;
            } else {
              macro.tracks.push.apply(macro.tracks, result.tracks);
              if (macro.length === null) {
                macro.length = result.length;
                //safest to assume that the service that knows the length
                //should also have the say on the chromosome_id
                macro.chromosome_id = result.chromosome_id;
              }
            }
          }
        }
        if (failed.length > 0)
          failure('failed to retrieve data from sources: ' + failed.join(', '));
        this._store.dispatch({type: ADD_MACRO_TRACKS, payload: macro});
      });
    }
    failure("no micro tracks provided");
  }

  // return a promise and handle success/error in components
  nearestGene(
    source: string,
    chromosome: number,
    position: number,
    success: Function,
    failure = e => {}
  ): void {
    let idx = this._serverIDs.indexOf(source);
    if (idx != -1) {
      let s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty('nearestGene')) {
        let args = {
          chromosome: chromosome,
          position: position
        };
        let url = s.nearestGene.url;
        let response: Observable<Response>;
        if (s.nearestGene.type === GET)
          response = this._http.get(url, args);
        else
          response = this._http.post(url, args);
        response.subscribe(res => {
          success(res.json());
        }, failure);
      } else {
        failure(s.id + " doesn't serve nearest gene requests");
      }
    } else {
      failure('invalid source: ' + source);
    }

  }
}
