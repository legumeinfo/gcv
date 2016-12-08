// Angular
import { Http, Response } from '@angular/http';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Store }          from '@ngrx/store';

// App store
import { ADD_MICRO_TRACKS } from '../constants/actions';
import { AppStore }         from '../models/app-store.model';
import { Gene }             from '../models/gene.model';
import { Group }						from '../models/group.model';
import { MicroTracks }      from '../models/micro-tracks.model';

// App services
import { GET, POST, Server } from '../models/server.model';
import { QueryParams }       from '../models/query-params.model';
import { SERVERS }           from '../constants/servers';

@Injectable()
export class MicroTracksService {
  tracks: Observable<MicroTracks>;

  private _servers = SERVERS;
  private _serverIDs = this._servers.map(s => s.id);

  constructor(private _http: Http, private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.tracks = this._store.select('micro-tracks');
  }

  basicQuery(queryGenes: string[], params: QueryParams): void {

  }

  geneSearch(source: string, queryGene: string, params: QueryParams): void {
    // fetch query track for gene
    let idx: number = this._serverIDs.indexOf(source);
    if (idx != -1) {
      let s: Server = this._servers[idx];
      if (s.hasOwnProperty('microQuery')) {
        let args = {
          gene: queryGene,
          numNeighbors: params.neighbors
        };
        let response: Observable<Response>;
        if (s.microQuery.type === GET)
          response = this._http.get(s.microQuery.url, args)
        else
          response = this._http.post(s.microQuery.url, args)
        response.map(res => JSON.parse(res.json())).subscribe(query => {
          query.source = source;
          this.trackSearch(query, params);
        });
      }
    }
  }

  trackSearch(query: Group, params: QueryParams): void {
    var args = {
      query: query.genes.map(g => g.family),
      numNeighbors: params.neighbors,
      numMatchedFamilies: params.matched,
      numNonFamily: params.intermediate
    };
		// send requests to the selected servers
    let requests: Observable<Response>[] = [];
    for (var i = 0; i < params.sources.length; ++i) {
      let id: string = params.sources[i];
      let idx: number = this._serverIDs.indexOf(id);
      if (idx != -1) {
        let s: Server = this._servers[idx];
        let response: Observable<Response>;
        if (s.microSearch.type === GET)
          response = this._http.get(s.microSearch.url, args);
        else
          response = this._http.post(s.microSearch.url, args);
        requests.push(response.map(res => {
          let tracks = JSON.parse(res.json());
          tracks.source = s.id;
          return tracks;
        }));
      }
    }
    // aggregate the results
    Observable.forkJoin(requests).subscribe(results => {
			let aggregateTracks: MicroTracks = {families: [], groups: [query]};
      for (var i = 0; i < results.length; ++i) {
        let tracks: any = results[i];
        // mark all group and genes with their source
        for (var j = 0; j < tracks.groups.length; ++j) {
          let group: any = tracks.groups[j];
          group.source = tracks.source;
          for (var k = 0; k < group.genes.length; ++k) {
            group.genes[k].source = group.source;
          }
        }
        // remove the query if present
        if (tracks.source == query.source) {
          tracks.groups = tracks.groups.filter(group  => {
            if (group.species_id == query.species_id &&
                group.chromosome_id == query.chromosome_id &&
                group.genes.length >= query.genes.length) {
              let geneIDs = group.genes.map(g => g.id);
              return query.genes.some(g => geneIDs.indexOf(g.id) == -1);
            } return true;
          });
        }
        // aggregate the remaining tracks
        aggregateTracks.families = tracks.families.concat(tracks.families);
        aggregateTracks.groups = tracks.groups.concat(tracks.groups);
      }
      this._store.dispatch({type: ADD_MICRO_TRACKS, payload: aggregateTracks})
    });
	}
}
