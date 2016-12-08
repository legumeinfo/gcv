import { SET_ALIGNMENT } from '../constants/actions';

export const alignmentFilter = (state: string = 'smith', {type, payload}) => {
  switch (type) {
    case SET_ALIGNMENT:
      return payload;
    default:
      return state;
  }
};
