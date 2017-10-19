export const selectedMicroTrack = (state: any = null, {type, payload}) => {
  switch(type) {
    case 'SELECT_MICRO_TRACK':
      return payload;
    default:
      return state;
  }
};
