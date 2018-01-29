import { StoreActions } from '../constants/store-actions';

export const macroChromosome = (state: any, {type, payload}) => {
  switch (type) {
    case StoreActions.NEW_MACRO_CHROMOSOME:
      return payload;
    default:
      return state;
  }
};
