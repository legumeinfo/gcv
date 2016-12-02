// Angular
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable }      from '@angular/core';
import { Observable }      from 'rxjs/Observable';
import { Store }           from '@ngrx/store';
import 'rxjs/add/operator/map';

// App store
import { AppStore }             from '../models/app-store.model';
import { AlignmentParams }      from '../models/alignment-params.model';
import { ADD_ALIGNED_MICRO_TRACKS,
         ADD_ALIGNMENT_PARAMS } from '../reducers/actions';
import { MicroTracks }          from '../models/micro-tracks.model';

@Injectable()
export class AlignmentService {
  params: BehaviorSubject<AlignmentParams>;
  private _tracks: BehaviorSubject<MicroTracks>;

  constructor(private _store: Store<AppStore>) {
    this.init();
  }

  init(): void {
    // downcast so we can get the last emitted value on demand
    this._tracks = <BehaviorSubject<MicroTracks>>this._store.select(
      'microTracks'
    );
    this._tracks.subscribe(tracks => {
      this._alignTracks();
    });
    this.params = <BehaviorSubject<AlignmentParams>>this._store.select(
      'alignmentParams'
    );
    this.params.subscribe(params => {
      this._alignTracks();
    });
  }

  private _alignTracks(): void {
    // TODO: perform alignment using this._params.getValue()
    this._store.dispatch({
      type: ADD_ALIGNED_MICRO_TRACKS,
      payload: this._tracks.getValue()
    });
  }

  private _updateStore(params: any): void {
    this._store.dispatch({type: ADD_ALIGNMENT_PARAMS, payload: params});
  }

  // params = AlignmentParams
  updateParams(params: any): void {
    this._updateStore(params);
	}
}
