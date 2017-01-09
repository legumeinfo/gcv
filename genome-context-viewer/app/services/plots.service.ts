// Angular
import { Http, Response } from '@angular/http';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';
import { Store }          from '@ngrx/store';

// App
import { AppStore }          from '../models/app-store.model';
import { ADD_GLOBAL_PLOTS,
         ADD_LOCAL_PLOTS,
         SELECT_PLOT,
         UPDATE_GLOBAL_PLOTS } from '../constants/actions';
import { Gene }                from '../models/gene.model';
import { GET, POST, Server }   from '../models/server.model';
import { Group }               from '../models/group.model';
import { MicroTracks }         from '../models/micro-tracks.model';
import { SERVERS }             from '../constants/servers';

@Injectable()
export class PlotsService {
  // TODO: make this more reactive
  private _query: any[];
  private _familyMap: any;

  private _globalPlots: Group[];
  private _localPlots: Group[];
  localPlots: Observable<Array<Group>>;
  private _selectedPlot: Group;
  selectedPlot: Observable<Group>;

  private _servers = SERVERS;
  private _serverIDs = this._servers.map(s => s.id);

  constructor(private _http: Http, private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this._store.select('microTracks').subscribe((tracks: MicroTracks) => {
      this._parseQuery(tracks);
      let localPlots = this._plotTracks(tracks);
      this._store.dispatch({type: ADD_LOCAL_PLOTS, payload: localPlots});
      this._store.dispatch({type: ADD_GLOBAL_PLOTS, payload: []});
    });
    this._store.select('globalPlots').subscribe((plots: Group[]) => {
      this._globalPlots = plots;
    });
    this.localPlots = this._store.select('localPlots');
    this.localPlots.subscribe(plots => {
      this._localPlots = plots;
    });
    this.selectedPlot = this._store.select('selectedPlot');
    this.selectedPlot.subscribe(plot => {
      this._selectedPlot = plot;
    });
  }

  private _parseQuery(tracks: MicroTracks): void {
    this._query = [];
    this._familyMap = {};
    if (tracks.groups.length > 0) {
  	  for (let i = 0; i < tracks.groups[0].genes.length; ++i) {
  	    let g = tracks.groups[0].genes[i];
        this._query.push(g.family);
  	    let p = (g.fmin + g.fmax) / 2;
  	    if (g.family in this._familyMap) {
  	      this._familyMap[g.family].push(p);
  	    } else if (g.family) {
  	      this._familyMap[g.family] = [p];
  	    }
  	  }
    }
  }

  private _plotGenes(genes): Gene[] {
    let plotGenes = [];
    for (let i = 0; i < genes.length; ++i) {
      if (genes[i].family in this._familyMap) {
        for (let j = 0; j < this._familyMap[genes[i].family].length; ++j) {
          let g = Object.assign({}, genes[i]);
          g.x = (g.fmin + g.fmax) / 2;
          g.y = this._familyMap[g.family][j];
          plotGenes.push(g);
        }
      } else {
        let g = Object.assign({}, genes[i]);
        g.x = (g.fmin + g.fmax) / 2;
        g.y = -1;
        plotGenes.push(g);
      }
    }
    return plotGenes;
  }

  private _plotTracks(tracks): Group[] {
    let plots = JSON.parse(JSON.stringify(tracks.groups)); 
    if (plots.length > 0) {
  	  for (let i = 0; i < plots.length; ++i) {
        let g = plots[i];
  	    g.genes = this._plotGenes(g.genes);
		  }
    }
    return plots;
  }

  selectPlot(plot: Group): void {
    this._store.dispatch({type: SELECT_PLOT, payload: plot});
  }

  getSelectedGlobal(success: Function, failure = e => {}): void {
    let local = this.getSelectedLocal();
    if (local !== undefined) {
      let idx = this._globalPlots.map(p => p.id).indexOf(this._selectedPlot.id);
      if (idx != -1) success(this._globalPlots[idx]);
      let source = this._selectedPlot.source;
      idx = this._serverIDs.indexOf(source)
      if (idx != -1) {
        let s: Server = this._servers[idx];
        if (s.hasOwnProperty('plotGlobal')) {
          let args = {
            query: this._query,
            chromosomeID: local.chromosome_id
          };
          let response: Observable<Response>;
          if (s.plotGlobal.type === GET)
            response = this._http.get(s.plotGlobal.url, args);
          else
            response = this._http.post(s.plotGlobal.url, args);
          response.subscribe(res => {
            let plot = Object.assign({}, local);
            plot.genes = this._plotGenes(res.json());
            for (let i = 0; i < plot.genes.length; ++i) {
              plot.genes[i].source = plot.source;
            }
            this._store.dispatch({type: UPDATE_GLOBAL_PLOTS, payload: plot})
            success(plot);
          }, failure);
        } else {
          failure(source + " doesn't support global plot requests");
        }
      } else {
        failure('invalid source: ' + source);
      }
    } else {
      failure('invalid plot selection');
    }
  }

  getSelectedLocal(): Group {
    if (this._selectedPlot !== undefined) {
      let idx = this._localPlots.map(p => p.id).indexOf(this._selectedPlot.id);
      if (idx != -1) return this._localPlots[idx];
    }
    return undefined;
  }
}
