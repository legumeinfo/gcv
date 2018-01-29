import { StoreActions }    from '../constants/store-actions';
import { AlignmentParams } from '../models/alignment-params.model';

export const alignmentParams = (state = new AlignmentParams(), {type, payload}) => {
  switch (type) {
    case StoreActions.UPDATE_ALIGNMENT_PARAMS:
      return payload;
    default:
      return state;
  }
};
