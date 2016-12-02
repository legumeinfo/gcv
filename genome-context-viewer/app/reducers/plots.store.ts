export const plots = (state: any = null, {type, payload}) => {
  switch (type) {
    // plots the new set of tracks and returns the result
    case 'ADD_TRACKS':
      return payload;
    // filters the plotted tracks
    case 'FILTER':
      return payload;
    default:
      return state;
  }
};
