// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// app
import { Store } from "@ngrx/store";
import { Algorithm } from "../models/algorithm.model";
import * as fromRoot from "../reducers";

@Injectable()
export class FilterService {
  order: Observable<Algorithm>;
  regexp: Observable<Algorithm>;

  constructor(private store: Store<fromRoot.State>) {
    // this.alignment = this._store.select("alignmentFilter");
    // this.order = this._store.select("orderFilter");
    // this.regexp = this._store.select("regexpFilter");
    this.order = Observable.empty<Algorithm>();
    this.regexp = Observable.empty<Algorithm>();
  }

  setOrder(order: string): void {
    // this._store.dispatch({type: StoreActions.SET_ORDER, payload: order});
  }

  setRegexp(regexp: string): void {
    // this._store.dispatch({type: StoreActions.SET_REGEXP, payload: regexp});
  }
}
