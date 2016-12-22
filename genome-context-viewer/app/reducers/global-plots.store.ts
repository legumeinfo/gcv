import { ADD_GLOBAL_PLOTS, UPDATE_GLOBAL_PLOTS } from '../constants/actions';

export const globalPlots = (state: any = [], {type, payload}) => {
  switch (type) {
    case ADD_GLOBAL_PLOTS:
      var global = JSON.parse(JSON.stringify(payload));
      return global;
    case UPDATE_GLOBAL_PLOTS:
      var global = JSON.parse(JSON.stringify(state));
      global.push(payload);
      return global;
    default:
      return state;
  }
}
