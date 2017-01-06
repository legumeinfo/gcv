import { ADD_LOCAL_PLOTS } from '../constants/actions';

export const localPlots = (state: any = [], {type, payload}) => {
  switch (type) {
    case ADD_LOCAL_PLOTS:
      return payload;
    default:
      return state;
  }
}
