// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// store
import { Store } from "@ngrx/store";
import * as orderFilterActions from "../actions/order-filter.actions";
import * as regexpFilterActions from "../actions/regexp-filter.actions";
import * as fromRoot from "../reducers";
import * as fromOrderFilter from "../reducers/order.store";
import * as fromRegexpFilter from "../reducers/regexp.store";
// app
import { ORDER_ALGORITHMS } from '../constants/order-algorithms';
import { Algorithm } from "../models/algorithm.model";
import { regexpAlgorithmFactory } from "../utils/regexp-algorithm-factory.util";

@Injectable()
export class FilterService {
  orderAlgorithm: Observable<Algorithm>;
  regexpAlgorithm: Observable<Algorithm>;

  private orderIDs = ORDER_ALGORITHMS.map(a => a.id);

  constructor(private store: Store<fromRoot.State>) {
    this.orderAlgorithm = this.store.select(fromOrderFilter.getOrderFilterAlgorithm);
    this.regexpAlgorithm = this.store.select(fromRegexpFilter.getRegexpFilterAlgorithm);
  }

  setOrder(order: string): void {
    const i = this.orderIDs.indexOf(order);
    if (i > -1) {
      this.store.dispatch(new orderFilterActions.New(ORDER_ALGORITHMS[i]));
    }
  }

  setRegexp(regexp: string): void {
    const algorithm = regexpAlgorithmFactory(regexp);
    this.store.dispatch(new regexpFilterActions.New(algorithm));
  }
}
