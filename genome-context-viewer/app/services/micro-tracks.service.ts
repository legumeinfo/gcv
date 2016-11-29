// Angular
import { Http, Headers } from '@angular/http';
import { Injectable }    from '@angular/core';
import { Store }         from '@ngrx/store';
import { Observable }    from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// App store
import { AppStore } from '../models/app-store.model';
import { MicroTracks }   from '../models/micro-tracks.model';

// App services
import { GET, POST, Server } from './server';
import { QueryParams }       from './query-params';
//import { SERVERS }           from './servers';
//import { Tracks }            from './tracks';

const BASE_URL = 'http://localhost:3000/micro-tracks';
const HEADER = {headers: new Headers({'Context-Type': 'application/json'})};

@Injectable()
export class MicroTracksService {
  tracks: Observable<MicroTracks>;

  constructor(private http: Http, private store: Store<AppStore>) {
    this.tracks = store.select('micro-tracks');  // Bind an observable of our tracks to "MicroTracksService"
  }

  loadTracks(params: QueryParams): void {
    let initialTracks: MicroTracks = {families: [], groups: []};
    this.store.dispatch({type: 'ADD_MICRO_TRACKS', payload: initialTracks});
    /*
    var args: {
      neighbors: number;
      matched: number;
      intermediate: number;
    } = params;  // TODO: does this strip servers attribute?
		// TODO: should aggregate tracks from all servers
    var s = params.servers[0];
    ((s.microSearch.type === GET)
		? this.http.get(s.microSearch.url, args)
    : this.http.post(s.microSearch.url, args))
      .map(res => res.json())
      .map(payload => ({type: 'ADD_MICRO_TRACKS', payload}))
      .subscribe(action => this.store.dispath(action));
    */
	}
}
