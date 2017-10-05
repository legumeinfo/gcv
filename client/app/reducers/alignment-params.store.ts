import { StoreActions }    from '../constants/store-actions';
import { AlignmentParams } from '../models/alignment-params.model';

export const alignmentParams = (state: AlignmentParams, {type, payload}) => {
  switch (type) {
    // replaces the existing state with the new state
    case StoreActions.ADD_ALIGNMENT_PARAMS:
      return payload;
    default:
      return state;
  }
};
