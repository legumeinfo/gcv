import { StoreActions } from '../constants/store-actions';

export const alignmentFilter = (state: string = 'smith', {type, payload}) => {
  switch (type) {
    case StoreActions.SET_ALIGNMENT:
      return payload;
    default:
      return state;
  }
};
