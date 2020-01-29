// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/core/store/actions/router.actions';
import * as fromRoot from '@gcv/reducers';
import * as fromRouter from '@gcv/gene/store/selectors/router';
// app
import { MACRO_ORDER_ALGORITHMS, MICRO_ORDER_ALGORITHMS }
  from '@gcv/gene/algorithms';
import { Algorithm } from '@gcv/gene/models';


@Injectable()
export class FilterService {

  private _macroOrderMap: any = {};
  private _microOrderMap: any = {};

  constructor(private _store: Store<fromRoot.State>) {
    MACRO_ORDER_ALGORITHMS.forEach((a) => {
      this._macroOrderMap[a.id] = a;
    });
    MICRO_ORDER_ALGORITHMS.forEach((a) => {
      this._microOrderMap[a.id] = a;
    });
  }

  private _updateUrlQueryString(key: string, value: string): void {
    const path = [];
    const query = {};
    query[key] = value;
    this._store.dispatch(new routerActions.Go({path, query}));
  }

  getMacroRegexp(): Observable<string> {
    return this._store.select(fromRouter.getMacroRegexp);
  }

  getMacroOrderAlgorithm(): Observable<Algorithm> {
    return this._store.select(fromRouter.getMacroOrder)
      .pipe(map((id) => this._macroOrderMap[id]));
  }

  getMicroRegexp(): Observable<string> {
    return this._store.select(fromRouter.getMicroRegexp);
  }

  getMicroOrderAlgorithm(): Observable<Algorithm> {
    return this._store.select(fromRouter.getMicroOrder)
      .pipe(map((id) => this._microOrderMap[id]));
  }

  setMacroOrder(order: string): void {
    this._updateUrlQueryString('border', order);
  }

  setMacroRegexp(regexp: string): void {
    this._updateUrlQueryString('bregexp', regexp);
  }

  setMicroOrder(order: string): void {
    this._updateUrlQueryString('order', order);
  }

  setMicroRegexp(regexp: string): void {
    this._updateUrlQueryString('regexp', regexp);
  }
}
