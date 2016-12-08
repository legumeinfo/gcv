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
import { Group }             from '../models/group.model';
import { MicroTracks }       from '../models/micro-tracks.model';

@Injectable()
export class PlotsService {
  localPlots: BehaviorSubject<MicroTracks>;
  selectedLocal: Observable<Group>;
  globalPlots: BehaviorSubject<MicroTracks>;
  selectedGlobal: Observable<Group>
  private _tracks: Observable<MicroTracks>;

  constructor(private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this._tracks = this._store.select('microTracks');
    this._tracks.subscribe(tracks => {
      this._plotTracks(tracks);
    });
    this.localPlots = <BehaviorSubject<MicroTracks>>this._store.select(
      'localPlots'
    );
    this.globalPlots = <BehaviorSubject<MicroTracks>>this._store.select(
      'globalPlots'
    );
  }

  private _plotTracks(tracks: MicroTracks): void {
    // TODO: perform plotting
    this._store.dispatch({type: ADD_LOCAL_PLOTS, payload: tracks});
    this._store.dispatch({type: ADD_GLOBAL_PLOTS, payload: tracks});
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
