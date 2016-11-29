export const selectedPlot = (state: any = null, {type, payload}) => {
  switch(type) {
    case 'SELECT_PLOT':
      return payload;
    default:
      return state;
  }
};
