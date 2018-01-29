import { StoreActions } from '../constants/store-actions';

export const route = (state: string, {type, payload}) => {
  switch (type) {
    case StoreActions.NEW_ROUTE:
      return payload;
    default:
      return state;
  }
};
