import { BlockParams }  from '../models/block-params.model';
import { StoreActions } from '../constants/store-actions';

export const blockParams = (state = new BlockParams(), {type, payload}) => {
  switch (type) {
    case StoreActions.UPDATE_BLOCK_PARAMS:
      return payload;
    default:
      return state;
  }
};
