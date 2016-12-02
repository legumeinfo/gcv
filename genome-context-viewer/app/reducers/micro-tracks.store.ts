export const microTracks = (state: any = null, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent as the new tracks
    case 'ADD_MICRO_TRACKS':
      return payload;
    // aligns the current set of tracks
    case 'ALIGN_MICRO_TRACKS':
      return payload;
    // filters the aligned tracks
    case 'FILTER':
      return payload;
    default:
      return state;
  }
};
