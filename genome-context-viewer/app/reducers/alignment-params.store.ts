import { ADD_ALIGNMENT_PARAMS } from '../constants/actions';
import { AlignmentParams }      from '../models/alignment-params.model';

export const alignmentParams = (
  state: AlignmentParams = new AlignmentParams('repeat', 3, -1, -1, 25, 10),
  {type, payload}
) => {
  switch (type) {
    // replaces the existing state with the new state
    case ADD_ALIGNMENT_PARAMS:
      return payload;
    default:
      return state;
  }
};
