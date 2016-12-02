export const urlQueryParams = (state: any = {}, {type, payload}) => {
  switch (type) {
    // returns whatever collection was sent merged with the existing set
    case 'ADD_QUERY_PARAMS':
      return Object.assign({}, state, payload);
    default:
      return state;
  }
};
