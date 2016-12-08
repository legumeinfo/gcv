import { SET_REGEXP } from '../constants/actions';

export const regexpFilter = (state: string = '', {type, payload}) => {
  switch (type) {
    case SET_REGEXP:
      return payload;
    default:
      return state;
  }
};
