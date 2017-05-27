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

  search(tracks: MicroTracks, failure = e => {}): void {
    if (tracks.groups.length > 0) {
      this._store.dispatch({type: ADD_MACRO_TRACKS, payload: undefined})
      let query = tracks.groups[0];
      let results = tracks.groups.reduce((l, g, i) => {
        if (i > 0 && g.source == query.source) l.push(g.chromosome_id);
        return l;
      }, []);
      let idx = this._serverIDs.indexOf(query.source)
      if (idx != -1) {
        let s: Server = AppConfig.SERVERS[idx];
        if (s.hasOwnProperty('macro')) {
          let args = {
            chromosome: query.chromosome_id,
            //results: results
          };
          let response: Observable<Response>;
          if (s.macro.type === GET)
            response = this._http.get(s.macro.url, args);
          else
            response = this._http.post(s.macro.url, args);
          response.subscribe(res => {
            let tracks = res.json();
            this._store.dispatch({type: ADD_MACRO_TRACKS, payload: tracks});
          }, failure);
        } else {
          failure(s.id + " doesn't serve macro track requests");
        }
      }
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
