import { ADD_ALIGNMENT_PARAMS } from '../constants/actions';

export const alignmentParams = (state: any = {}, {type, payload}) => {
  switch (type) {
    // replaces the existing state with the new state
    case ADD_ALIGNMENT_PARAMS:
      return payload;
    default:
      return state;
  }
};
