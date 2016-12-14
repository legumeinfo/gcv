// Angular
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable }      from '@angular/core';
import { Observable }      from 'rxjs/Observable';
import { Store }           from '@ngrx/store';
import 'rxjs/add/operator/map';

// App store
import { AppStore }          from '../models/app-store.model';
import { ADD_GLOBAL_PLOTS,
         ADD_LOCAL_PLOTS,
         SELECT_GLOBAL_PLOT,
         SELECT_LOCAL_PLOT } from '../constants/actions';
import { Gene }              from '../models/gene.model';
import { Group }             from '../models/group.model';
import { MicroTracks }       from '../models/micro-tracks.model';

@Injectable()
export class PlotsService {
  localPlots: Observable<MicroTracks>;
  selectedLocal: Observable<Group>;
  globalPlots: BehaviorSubject<MicroTracks>;
  selectedGlobal: Observable<Group>

  constructor(private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.localPlots = this._store.select('microTracks').let(this._plotTracks());
    this.globalPlots = <BehaviorSubject<MicroTracks>>this._store.select(
      'globalPlots'
    );
  }

  private _plotGenes(familyMap, genes): Gene[] {
    let plotGenes = [];
    for (let i = 0; i < genes.length; ++i) {
      let g = Object.assign({}, genes[i]);
      g.x = (g.fmin + g.fmax) / 2;
      if (g.family in familyMap) {
        for (let j = 0; j < familyMap[g.family].length; ++j) {
          g.y = familyMap[g.family][j];
        }
      } else {
        g.y = -1;
      }
      plotGenes.push(g);
    }
    return plotGenes;
  }

  private _plotTracks = () => {
    return state => state.map(tracks => {
      let plots = JSON.parse(JSON.stringify(tracks)); 
      if (plots.groups.length > 0) {
    	  let familyMap = {};
        // map the query family locations
    	  for (let i = 0; i < plots.groups[0].genes.length; ++i) {
    	    let g = plots.groups[0].genes[i];
    	    let p = (g.fmin + g.fmax) / 2;
    	    if (g.family in familyMap) {
    	      familyMap[g.family].push(p);
    	    } else if (g.family != '') {
    	      familyMap[g.family] = [p];
    	    }
    	  }
    	  // plot all the genes against the list of points
    	  for (let i = 0; i < plots.groups.length; ++i) {
          let g = plots.groups[i];
    	    g.genes = this._plotGenes(familyMap, g.genes);
			  }
      }
      return plots;
    });
  }

  selectGlobal(plot: Group): void {
    // TODO: perform selection using localPlots.getValue()
    // TODO: fetch genes from service if necessary
    this._store.dispatch({type: SELECT_GLOBAL_PLOT, payload: plot});
  }

  selectLocal(plot: Group): void {
    // TODO: perform selection using globalPlots.getValue()
    this._store.dispatch({type: SELECT_LOCAL_PLOT, payload: plot});
  }
}
