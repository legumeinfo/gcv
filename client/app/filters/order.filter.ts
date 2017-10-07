import { Algorithm }        from '../models/algorithm.model';
import { ORDER_ALGORITHMS } from '../constants/order-algorithms';
import { StoreActions }     from '../constants/store-actions';

export const orderFilter = (state: Algorithm = ORDER_ALGORITHMS[0], {type, payload}) => {
  let ids = ORDER_ALGORITHMS.map(a => a.id);
  switch (type) {
    case StoreActions.SET_ORDER:
      let idx = ids.indexOf(payload);
      if (idx != -1) return ORDER_ALGORITHMS[idx];
      return state;
    default:
      return state;
  }
};
