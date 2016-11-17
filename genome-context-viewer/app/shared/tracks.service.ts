import 'rxjs/add/operator/toPromise';
import { Injectable } from '@angular/core';
import { Http }				from '@angular/http';

import { QueryParams}        from './query-params.ts';
import { GET, POST, Server } from './Server';
import { Servers }           from './Servers';

@Injectable()
export class TrackService {
	constructor(private http: Http) { }
	
	getTracks(params: QueryParams): Promise<Tracks> {
    args = {
      neighbors: params.neighbors,
      matched: params.matched,
      intermediate: params.intermediate
    }
		// TODO: should aggregate tracks from all servers
    Server s = params.servers[0];
    if (s.microSearch.type === GET) {
		  return this.http.get(s.microSearch.url, args);
    } return this.http.post(s.microSearch.url, args);
	}
}
