export const selectedGene = (state: any = null, {type, payload}) => {
  switch(type) {
    case 'SELECT_GENE':
      return payload;
    default:
      return state;
  }
};
