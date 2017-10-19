// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App store
import { AlignmentParams } from '../models/alignment-params.model';
import { AppStore }        from '../models/app-store.model';
import { StoreActions }    from '../constants/store-actions';

@Injectable()
export class AlignmentService {
  alignmentParams: Observable<AlignmentParams>;

  constructor(private _store: Store<AppStore>) {
    this.alignmentParams = this._store.select('alignmentParams')
  }

  updateParams(params: AlignmentParams): void {
    if (params !== undefined)
      this._store.dispatch({type: StoreActions.ADD_ALIGNMENT_PARAMS,
        payload: params});
	}
}
