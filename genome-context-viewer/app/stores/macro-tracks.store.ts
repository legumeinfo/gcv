export const macroTracks = (state: any = null, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent as the new tracks
    case 'ADD_MACRO_TRACKS':
      return payload;
    // filters the aligned tracks
    case 'FILTER':
      return payload;
    default:
      return state;
  }
};
