export const selectedFamily = (state: any = null, {type, payload}) => {
  switch(type) {
    case 'SELECT_FAMILY':
      return payload;
    default:
      return state;
  }
};
