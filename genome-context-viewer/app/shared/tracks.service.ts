import 'rxjs/add/operator/toPromise';
import { Http }				from '@angular/http';
import { Injectable } from '@angular/core';

import { GET, POST, Server } from './server';
import { QueryParams}        from './query-params';
import { SERVERS }           from './servers';
import { Tracks }            from './tracks';

@Injectable()
export class TracksService {
	constructor(private http: Http) { }
	
	getTracks(params: QueryParams): Promise<Tracks> {
    var args: {
      neighbors: number;
      matched: number;
      intermediate: number;
    } = params;  // TODO: does this strip servers attribute?
		// TODO: should aggregate tracks from all servers
    var s = params.servers[0];
    return ((s.microSearch.type === GET)
		  ? this.http.get(s.microSearch.url, args)
      : this.http.post(s.microSearch.url, args))
        .toPromise()
        .then(response => response.json().data as Tracks)
        .catch(this.handleError);
	}

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);  // for development purposes only
    return Promise.reject(error.message || error);
  }
}
