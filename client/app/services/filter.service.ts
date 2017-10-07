// Angular
import { Injectable }      from '@angular/core';
import { Observable }      from 'rxjs/Observable';
import { Store }           from '@ngrx/store';

// App
import { Algorithm }    from '../models/algorithm.model';
import { AppStore }     from '../models/app-store.model';
import { StoreActions } from '../constants/store-actions';

@Injectable()
export class FilterService {
  alignment: Observable<Algorithm>;
  order: Observable<Algorithm>;
  regexp: Observable<Algorithm>;

  constructor(private _store: Store<AppStore>) {
    this.alignment = this._store.select('alignmentFilter');
    this.order = this._store.select('orderFilter');
    this.regexp = this._store.select('regexpFilter');
  }

  setAlignment(alignment: Algorithm): void {
    this._store.dispatch({type: StoreActions.SET_ALIGNMENT, payload: alignment});
  }

  setOrder(order: string): void {
    this._store.dispatch({type: StoreActions.SET_ORDER, payload: order});
  }

  setRegexp(regexp: string): void {
    this._store.dispatch({type: StoreActions.SET_REGEXP, payload: regexp});
  }
}
