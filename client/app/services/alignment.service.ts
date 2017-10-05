// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App store
import { ADD_ALIGNMENT_PARAMS } from '../constants/actions';
import { AlignmentParams }      from '../models/alignment-params.model';
import { AppStore }             from '../models/app-store.model';

@Injectable()
export class AlignmentService {
  alignmentParams: Observable<AlignmentParams>;

  constructor(private _store: Store<AppStore>) {
    this.alignmentParams = this._store.select('alignmentParams')
  }

  updateParams(params: AlignmentParams): void {
    this._store.dispatch({type: ADD_ALIGNMENT_PARAMS, payload: params});
	}
}
