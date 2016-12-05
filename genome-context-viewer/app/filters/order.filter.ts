import { SET_ORDER } from '../reducers/actions';

export const orderFilter = (state: string = 'chromosome', {type, payload}) => {
  switch (type) {
    case SET_ORDER:
      return payload;
    default:
      return state;
  }
};
