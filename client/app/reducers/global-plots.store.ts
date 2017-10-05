import { StoreActions } from '../constants/store-actions';

export const globalPlots = (state: any = [], {type, payload}) => {
  switch (type) {
    case StoreActions.ADD_GLOBAL_PLOTS:
      var global = JSON.parse(JSON.stringify(payload));
      return global;
    case StoreActions.UPDATE_GLOBAL_PLOTS:
      var global = JSON.parse(JSON.stringify(state));
      global.push(payload);
      return global;
    default:
      return state;
  }
}
