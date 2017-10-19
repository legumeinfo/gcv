import { StoreActions } from '../constants/store-actions';

export const selectedPlot = (state: any = undefined, {type, payload}) => {
  switch (type) {
    case StoreActions.SELECT_PLOT:
      return payload;
    default:
      return state;
  }
}
