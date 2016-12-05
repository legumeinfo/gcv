// Angular
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable }      from '@angular/core';
import { Observable }      from 'rxjs/Observable';
import { Store }           from '@ngrx/store';
import 'rxjs/add/operator/map';

// App store
import { Algorithm }  from '../models/algorithm.model';
import { AppStore }   from '../models/app-store.model';
import { SET_ALIGNMENT,
         SET_ORDER,
         SET_REGEXP } from '../reducers/actions';

@Injectable()
export class FilterService {
  alignment: Observable<Algorithm>;
  order: Observable<Algorithm>;
  regexp: Observable<Algorithm>;

  constructor(private _store: Store<AppStore>) {
    this.init();
  }

  init(): void {
    this.alignment = this._store.select('alignmentFilter');
    this.order = this._store.select('order');
    this.regexp = this._store.select('regexp');
  }

  setAlignment(alignment: Algorithm): void {
    this._store.dispatch({type: SET_ALIGNMENT, payload: alignment});
  }

  setOrder(order: Algorithm): void {
    this._store.dispatch({type: SET_ORDER, payload: order});
  }

  setRegexp(regexp: Algorithm): void {
    this._store.dispatch({type: SET_REGEXP, payload: regexp});
  }
}
