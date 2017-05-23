// Angular
import { Http, Response } from '@angular/http';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Store }          from '@ngrx/store';

// App
import { AppConfig }         from '../app.config';
import { ADD_MICRO_TRACKS }  from '../constants/actions';
import { AppStore }          from '../models/app-store.model';
import { Family }            from '../models/family.model';
import { Gene }              from '../models/gene.model';
import { GET, POST, Server } from '../models/server.model';
import { Group }						 from '../models/group.model';
import { MicroTracks }       from '../models/micro-tracks.model';
import { QueryParams }       from '../models/query-params.model';

@Injectable()
export class MicroTracksService {
  tracks: Observable<MicroTracks>;

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  constructor(private _http: Http, private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.tracks = this._store.select('microTracks');
  }

  private _prepareTrack(source: string, track: Group): void {
    track.source = source;
    for (let j = 0; j < track.genes.length; ++j) {
      let gene: Gene = track.genes[j];
      gene.source = source;
      gene.x = j;
      gene.y = 0;
    }
  }

  private _parseMicroTracksJSON(source: Server, json: any): MicroTracks {
    let tracks: MicroTracks = JSON.parse(json);
    for (let i = 0; i < tracks.groups.length; ++i) {
      let group: Group = tracks.groups[i];
      this._prepareTrack(source.id, group);
    }
    return tracks;
  }

  private _idTracks(tracks: MicroTracks): void {
    for (let i = 0; i < tracks.groups.length; ++i) {
      tracks.groups[i].id = i;
    }
  }

  basicQuery(
    queryGenes: string[],
    params: QueryParams,
    failure = e => {}
  ): void {
    let args = {
      genes: queryGenes,
      neighbors: params.neighbors
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
      if (s.hasOwnProperty('microBasic')) {
        let response: Observable<Response>;
        if (s.microBasic.type === GET)
          response = this._http.get(s.microBasic.url, args);
        else
          response = this._http.post(s.microBasic.url, args);
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
      let families: Family[] = [];
      let groups: Group[] = [];
      let maxLength: number = (params.neighbors * 2) + 1;
      for (let h = 0; h < results.length; ++h) {
        let result = results[h];
        let source = sources[h];
        if (result == null) {
          failed.push(source.id);
        } else {
          let tracks: MicroTracks = this._parseMicroTracksJSON(source, result);
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
      }
      if (failed.length > 0)
        failure('failed to retrieve data from sources: ' + failed.join(', '));
      let aggregateTracks = new MicroTracks(families, groups);
      this._idTracks(aggregateTracks);
      this._store.dispatch({type: ADD_MICRO_TRACKS, payload: aggregateTracks})
    });
  }

  geneSearch(
    source: string,
    queryGene: string,
    params: QueryParams,
    failure = e => {}
  ): void {
    // fetch query track for gene
    let idx: number = this._serverIDs.indexOf(source);
    if (idx != -1) {
      let s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty('microQuery')) {
        let args = {
          gene: queryGene,
          neighbors: params.neighbors
        };
        let response: Observable<Response>;
        if (s.microQuery.type === GET)
          response = this._http.get(s.microQuery.url, args)
        else
          response = this._http.post(s.microQuery.url, args)
        response.map(res => JSON.parse(res.json())).subscribe(query => {
          this._prepareTrack(source, query);
          this.trackSearch(query, params, failure);
        }, failure);
      } else {
        failure(s.id + " doesn't serve micro track gene search requests");
      }
    } else {
      failure('invalid source: ' + source);
    }
  }

  trackSearch(query: Group, params: QueryParams, failure = e => {}): void {
    let args = {
      query: query.genes.map(g => g.family),
      matched: params.matched,
      intermediate: params.intermediate
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
      if (s.hasOwnProperty('microSearch')) {
        let response: Observable<Response>;
        if (s.microSearch.type === GET)
          response = this._http.get(s.microSearch.url, args);
        else
          response = this._http.post(s.microSearch.url, args);
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
      let families: Family[] = [];
      let groups: Group[] = [query];
      let geneIDs = query.genes.map(g => g.id);
      for (let i = 0; i < results.length; ++i) {
        let result = results[i];
        let source = sources[i];
        if (result == null) {
          failed.push(source.id);
        } else {
          let tracks: MicroTracks = this._parseMicroTracksJSON(source, result);
          // remove tracks that overlap with the query
          if (source.id == query.source) {
            tracks.groups = tracks.groups.filter(group  => {
              if (group.species_id == query.species_id
              && group.chromosome_id == query.chromosome_id) {
                return !group.genes.some(g => geneIDs.indexOf(g.id) !== -1);
              } return true;
            });
          }
          // aggregate the remaining tracks
          families.push.apply(families, tracks.families);
          groups.push.apply(groups, tracks.groups);
        }
      }
      if (failed.length > 0)
        failure('failed to retrieve data from sources: ' + failed.join(', '));
      let aggregateTracks = new MicroTracks(families, groups);
      this._idTracks(aggregateTracks);
      this._store.dispatch({type: ADD_MICRO_TRACKS, payload: aggregateTracks})
    });
	}
}
