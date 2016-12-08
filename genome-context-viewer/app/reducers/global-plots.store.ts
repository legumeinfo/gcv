import { ADD_GLOBAL_PLOT, ADD_GLOBAL_PLOTS } from '../constants/actions';

export const globalPlots = (state: any = {}, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent after stripping the genes from each
    case ADD_GLOBAL_PLOTS:
      var global = JSON.parse(JSON.stringify(payload));
      for (var i = 0; i < global.groups.length; ++i) {
        global.groups[i].genes = [];
      }
      return global;
    // add the given global plot to the state
    case ADD_GLOBAL_PLOT:
      return state;
    default:
      return state;
  }
}
