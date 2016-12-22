import { SELECT_PLOT } from '../constants/actions';

export const selectedPlot = (state: any = undefined, {type, payload}) => {
  switch (type) {
    case SELECT_PLOT:
      return payload;
    default:
      return state;
  }
}
