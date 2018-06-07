// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
// store
import { Store } from "@ngrx/store";
import * as orderFilterActions from "../store/actions/order-filter.actions";
import * as regexpFilterActions from "../store/actions/regexp-filter.actions";
import * as fromRoot from "../store/reducers";
import * as fromOrderFilter from "../store/reducers/order.store";
import * as fromRegexpFilter from "../store/reducers/regexp.store";
// app
import { ORDER_ALGORITHMS } from "../algorithms";
import { Algorithm } from "../models";
import { regexpAlgorithmFactory } from "../utils";

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
