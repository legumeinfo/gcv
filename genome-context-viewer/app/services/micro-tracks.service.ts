// Angular
import { Http, Headers, Response } from '@angular/http';
import { Injectable }    from '@angular/core';
import { Store }         from '@ngrx/store';
import { Observable }    from 'rxjs/Observable';
import 'rxjs/add/operator/map';

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
//import { Tracks }            from './tracks';

const HEADER = {headers: new Headers({'Context-Type': 'application/json'})};

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

  loadBasicTracks(params: QueryParams): void {

  }

  geneSearch(queryGene: string, params: QueryParams): void {
    // fetch query track for gene
    // this.loadSearchTracks(queryTrack, params)
  }

  trackSearch(query: Group, params: QueryParams): void {
    var args = {
      neighbors: params.neighbors,
      matched: params.matched,
      intermediate: params.intermediate,
    };
    console.log('args:');
    console.log(args);
		// aggregate tracks from all selected servers
    let requests: Observable<Response>[] = [];
    console.log('servers:');
    for (var i = 0; i < params.sources.length; ++i) {
      let id: string = params.sources[i];
      let idx: number = this._serverIDs.indexOf(id);
      if (idx != -1) {
        let s: Server = this._servers[idx];
        console.log(s);
        if (s.microSearch.type === GET)
          requests.push(this._http.get(s.microSearch.url, args)
            .map(res => res.json()))
        else
          requests.push(this._http.post(s.microSearch.url, args)
            .map(res => res.json()))
      }
    }
    Observable.forkJoin(requests).subscribe(results => {
			let tracks: MicroTracks = {families: [], groups: [query]};
      console.log('results:');
      console.log(results);
      //for (var i = 0; i < results.length; ++i) {
      //  track: Group = results[i];
      //  var src = dataset[i].source;
      //  var d = JSON.parse(dataset[i].response.data);
      //  // tag each track and its genes with their source
      //  for (var j = 0; j < d.groups.length; j++) {
      //    d.groups[j].source = track.source;
      //    for (var k in d.groups[j].genes) {
      //      d.groups[j].genes[k].source = track.source;
      //    }
      //  }
      //  // remove the query if present
      //  if (src == query.source) {
      //    d.groups = d.groups.filter(function (track) {
      //      if (track.species_id == query.species_id &&
      //          track.chromosome_id == query.chromosome_id &&
      //          track.genes.length >= query.genes.length) {
      //        var gene_ids = track.genes.map(function (g) { return g.id; });
      //        for (var j = query.genes.length; j--;) {
      //          if (gene_ids.indexOf(query.genes[j].id) == -1 )
      //            return true;
      //        } return false;
      //      } return true;
      //    });
      //  }
      //  // aggregate the remaining tracks
      //  tracks.families = tracks.families.concat(d.families);
      //  tracks.groups = tracks.groups.concat(d.groups);
      //}
      //this._store.dispath({type: ADD_MICRO_TRACKS, tracks})
    });
	}
}
