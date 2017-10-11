import { StoreActions } from '../constants/store-actions';

export const localPlots = (state: any = [], {type, payload}) => {
  switch (type) {
    case StoreActions.ADD_LOCAL_PLOTS:
      return payload;
    default:
      return state;
  }
}
