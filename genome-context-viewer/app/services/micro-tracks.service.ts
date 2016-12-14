// Angular
import { Http, Response } from '@angular/http';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Store }          from '@ngrx/store';

// App store
import { ADD_MICRO_TRACKS } from '../constants/actions';
import { AppStore }         from '../models/app-store.model';
import { Family }           from '../models/family.model';
import { Gene }             from '../models/gene.model';
import { Group }						from '../models/group.model';
import { MicroTracks }      from '../models/micro-tracks.model';

// App services
import { GET, POST, Server } from '../models/server.model';
import { QueryParams }       from '../models/query-params.model';
import { SERVERS }           from '../constants/servers';

declare var GCV: any;

@Injectable()
export class MicroTracksService {
  tracks: Observable<MicroTracks>;

  private _servers = SERVERS;
  private _serverIDs = this._servers.map(s => s.id);

  constructor(private _http: Http, private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.tracks = this._store.select('microTracks');
  }

  private _parseMicroTracksJSON(source: Server, json: any): MicroTracks {
    let tracks: MicroTracks = JSON.parse(json);
    for (let i = 0; i < tracks.groups.length; ++i) {
      let group: Group = tracks.groups[i];
      group.source = source.id;
      for (let j = 0; j < group.genes.length; ++j) {
        let gene: Gene = group.genes[j];
        gene.source = group.source;
        gene.x = j;
        gene.y = 0;
      }
    }
    return tracks;
  }

  private _idTracks(tracks: MicroTracks): void {
    for (let i = 0; i < tracks.groups.length; ++i) {
      tracks.groups[i].id = i;
    }
  }

  basicQuery(queryGenes: string[], params: QueryParams): void {
    let args = {
      genes: queryGenes,
      numNeighbors: params.neighbors
    };
		// send requests to the selected servers
    let requests: Observable<Response>[] = [];
    let sources = params.sources.reduce((l, s) => {
      let i = this._serverIDs.indexOf(s);
      if (i != -1) l.push(this._servers[i]);
      return l;
    }, []);
    for (let i = 0; i < sources.length; ++i) {
      let s: Server = sources[i];
      let response: Observable<Response>;
      if (s.microSearch.type === GET)
        response = this._http.get(s.microBasic.url, args);
      else
        response = this._http.post(s.microBasic.url, args);
      requests.push(response.map(res => res.json()));
    }
    // aggregate the results
    Observable.forkJoin(requests).subscribe(results => {
      let families: Family[] = [];
      let groups: Group[] = [];
      let maxLength: number = (params.neighbors * 2) + 1;
      for (let h = 0; h < results.length; ++h) {
        let tracks: MicroTracks = this._parseMicroTracksJSON(
          sources[h],
          results[h]
        );
        // center the tracks on the focus family
        let centers = [];
        for (let i = 0; i < tracks.groups.length; ++i) {
          let group: Group = tracks.groups[i];
          let genes: Gene[] = group.genes;
          let offset = 0;
          if (group.genes.length < maxLength) {
            for (let j = genes.length - 1; j >= 0; --j) {
              let g: Gene = genes[j];
              if (queryGenes.indexOf(g.name) != -1) {
                if (centers.indexOf(g.name) == -1) {
                  centers.push(g.name);
                  offset = params.neighbors - j;
                  break;
                }
              }
            }
          }
          // set the gene positions relative to their track (group)
          for (let j = 0; j < genes.length; ++j) {
            let g: Gene = genes[j];
            g.x = offset + j;
            g.y = 0;
          }
        }
        // aggregate
        families.push.apply(families, tracks.families);
        groups.push.apply(groups, tracks.groups);
      }
      let aggregateTracks = new MicroTracks(families, groups);
      this._idTracks(aggregateTracks);
      this._store.dispatch({type: ADD_MICRO_TRACKS, payload: aggregateTracks})
    });
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
    let args = {
      query: query.genes.map(g => g.family),
      numNeighbors: params.neighbors,
      numMatchedFamilies: params.matched,
      numNonFamily: params.intermediate
    };
		// send requests to the selected servers
    let requests: Observable<Response>[] = [];
    let sources = params.sources.reduce((l, s) => {
      let i = this._serverIDs.indexOf(s);
      if (i != -1) l.push(this._servers[i]);
      return l;
    }, []);
    for (let h = 0; h < sources.length; ++h) {
      let s: Server = sources[h];
      let response: Observable<Response>;
      if (s.microSearch.type === GET)
        response = this._http.get(s.microSearch.url, args);
      else
        response = this._http.post(s.microSearch.url, args);
      requests.push(response.map(res => res.json()));
    }
    // aggregate the results
    Observable.forkJoin(requests).subscribe(results => {
      let families: Family[] = [];
      let groups: Group[] = [query];
      for (let i = 0; i < results.length; ++i) {
        let source = sources[i];
        let tracks: MicroTracks = this._parseMicroTracksJSON(
          source,
          results[i]
        );
        // remove the query if present
        if (source.id == query.source) {
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
        families.push.apply(families, tracks.families);
        groups.push.apply(groups, tracks.groups);
      }
      let aggregateTracks = new MicroTracks(families, groups);
      this._idTracks(aggregateTracks);
      this._store.dispatch({type: ADD_MICRO_TRACKS, payload: aggregateTracks})
    });
	}
}
