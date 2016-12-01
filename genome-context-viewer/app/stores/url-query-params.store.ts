export const urlQueryParams = (state: any = null, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent merged with the existing set
    case 'ADD_QUERY_PARAMS':
      return payload;
    default:
      return state;
  }
};
