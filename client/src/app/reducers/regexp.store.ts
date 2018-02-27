import { Algorithm }    from '../models/algorithm.model';
import { StoreActions } from '../constants/store-actions';

export const regexpFilter = (
  state: Algorithm = new Algorithm('regexp', 'Regular Expression', t => t),
  {type, payload}
) => {
  let filterFn = function (regexp, tracks, options) {
    options = options || {};
    options.skipFirst = options.skipFirst || false;
    let filter = new RegExp(regexp);
    let filteredTracks = Object.assign({}, tracks);
    filteredTracks.groups = filteredTracks.groups.filter((track, i) => {
      if (options.skipFirst && i == 0) return true;
      return filter.test(track.chromosome_name);
    });
    return filteredTracks;
  }
  switch (type) {
    case StoreActions.SET_REGEXP:
      return new Algorithm(
        'regexp',
        'Regular Expression',
        filterFn.bind(this, payload)
      );
    default:
      return state;
  }
};
