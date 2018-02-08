// Angular
import { Http, RequestOptionsArgs , Response } from '@angular/http';
import { Injectable }                          from '@angular/core';
import { Observable }                          from 'rxjs/Observable';
import { Store }                               from '@ngrx/store';

// App
import { AppConfig }         from '../app.config';
import { AppRoutes }         from '../constants/app-routes';
import { AppRouteService }   from './app-route.service';
import { AppStore }          from '../models/app-store.model';
import { argsByValue }       from '../decorators/args-by-value.decorator';
import { StoreActions }      from '../constants/store-actions';
import { Gene }              from '../models/gene.model';
import { GET, POST, Server } from '../models/server.model';
import { Group }             from '../models/group.model';
import { MicroTracks }       from '../models/micro-tracks.model';

@Injectable()
export class PlotsService extends AppRouteService {
  // TODO: make this more reactive
  localPlots: Observable<Array<Group>>;
  selectedPlot: Observable<Group>;

  private _query: any[];
  private _familyMap: any;

  private _globalPlots: Group[];
  private _localPlots: Group[];
  private _selectedPlot: Group;

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  constructor(private _http: Http, private _store: Store<AppStore>) {
    super(_store);

    // initialize observables
    this.localPlots   = this._store.select('localPlots');
    this.selectedPlot = this._store.select('selectedPlot');
    let microTracks   = this._store.select<MicroTracks>('microTracks');
    let globalPlots   = this._store.select<Array<Group>>('globalPlots');

    // subscribe to changes that update local plots
    this.localPlots
      .filter(plot => this._route == AppRoutes.SEARCH)
      .subscribe(plots => this._localPlots = plots);

    // subscribe to changes that update the selected plot
    this.selectedPlot
      .filter(plot => this._route == AppRoutes.SEARCH)
      .subscribe(plot => this._selectedPlot = plot);

    // subscribe to changes 
    microTracks
      .filter(tracks => this._route == AppRoutes.SEARCH)
      .subscribe((tracks: MicroTracks) => {
        this._parseQuery(tracks);
        let localPlots = this._plotTracks(tracks),
            action1    = {
                type: StoreActions.ADD_LOCAL_PLOTS,
                payload: localPlots
              };
        this._store.dispatch(action1);
        let action2 = {type: StoreActions.ADD_GLOBAL_PLOTS, payload: []};
        this._store.dispatch(action2);
      });

    globalPlots
      .filter(plots => this._route == AppRoutes.SEARCH)
      .subscribe((plots: Group[]) => {
        this._globalPlots = plots;
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

  @argsByValue()
  private _plotTracks(tracks): Group[] {
    let plots = tracks.groups; 
    if (plots.length > 0) {
  	  for (let i = 0; i < plots.length; ++i) {
        let g = plots[i];
  	    g.genes = this._plotGenes(g.genes);
		  }
    }
    return plots;
  }

  selectPlot(plot: Group): void {
    this._store.dispatch({type: StoreActions.SELECT_PLOT, payload: plot});
  }

  getSelectedGlobal(success: Function, failure = e => {}): void {
    let local = this.getSelectedLocal();
    if (local !== undefined) {
      let idx = this._globalPlots.map(p => p.id).indexOf(this._selectedPlot.id);
      if (idx != -1) success(this._globalPlots[idx]);
      let source = this._selectedPlot.source;
      idx = this._serverIDs.indexOf(source)
      if (idx != -1) {
        let s: Server = AppConfig.SERVERS[idx];
        if (s.hasOwnProperty('plotGlobal')) {
          let args = {
            query: this._query,
            chromosome: local.chromosome_id
          } as RequestOptionsArgs;
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
            this._store.dispatch({type: StoreActions.UPDATE_GLOBAL_PLOTS,
              payload: plot})
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
