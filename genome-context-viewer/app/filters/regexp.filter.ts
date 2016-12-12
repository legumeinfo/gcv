import { Algorithm }  from '../models/algorithm.model';
import { SET_REGEXP } from '../constants/actions';

export const regexpFilter = (
  state: Algorithm = new Algorithm('regexp', 'Regular Expression', t => t),
  {type, payload}
) => {
  let filterFn = function (regexp, tracks) {
    let filter = new RegExp(regexp);
    let filteredTracks = Object.assign({}, tracks);
    filteredTracks.groups = filteredTracks.groups.filter(track => {
      return filter.test(track.chromosome_name);
    });
    return filteredTracks;
  }
  switch (type) {
    case SET_REGEXP:
      return new Algorithm(
        'regexp',
        'Regular Expression',
        filterFn.bind(this, payload)
      );
    default:
      return state;
  }
};
