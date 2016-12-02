import { SELECT_LOCAL_PLOT } from './actions';

export const selectedLocalPlot = (state: any = {}, {type, payload}) => {
  switch(type) {
    case SELECT_LOCAL_PLOT:
      return payload;
    default:
      return state;
  }
};
