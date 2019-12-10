// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/core/store/actions/router.actions';
import * as fromRoot from '@gcv/reducers';
import * as fromRouter from '@gcv/gene/store/selectors/router/';
// app
import { ORDER_ALGORITHMS } from '@gcv/gene/algorithms';
import { Algorithm } from '@gcv/gene/models';


@Injectable()
export class FilterService {

  private _typingTimer;
  private _doneTypingInterval = 1000;  // 1 seconds
  private _orderMap: any = {};

  constructor(private _store: Store<fromRoot.State>) {
    ORDER_ALGORITHMS.forEach((a) => {
      this._orderMap[a.id] = a;
    });
  }

  getRegexp(): Observable<string> {
    return this._store.select(fromRouter.getRegexp)
      .pipe(filter((regexp) => regexp != undefined));
  }

  getOrderAlgorithm(): Observable<Algorithm> {
    return this._store.select(fromRouter.getOrder)
      .pipe(
        filter((id) => id !== undefined && id in this._orderMap),
        map((id) => this._orderMap[id]),
      );
  }

  setOrder(order: string): void {
    const path = [];
    const query = Object.assign({}, {order});
    this._store.dispatch(new routerActions.Go({path, query}));
  }

  setRegexp(regexp: string): void {
    clearTimeout(this._typingTimer);
    this._typingTimer = setTimeout(() => {
      const path = [];
      const query = Object.assign({}, {regexp});
      this._store.dispatch(new routerActions.Go({path, query}));
    }, this._doneTypingInterval);
  }
}
