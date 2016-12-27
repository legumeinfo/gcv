import { ADD_QUERY_PARAMS }     from '../constants/actions';
import { ALIGNMENT_ALGORITHMS } from '../constants/alignment-algorithms';
import { ORDER_ALGORITHMS }     from '../constants/order-algorithms';
import { SERVERS }              from '../constants/servers';
import { UrlQueryParams }       from '../models/url-query-params.model';

export const urlQueryParams = (state: any = Object.create(UrlQueryParams.prototype),
{type, payload}) => {
  // TODO: add getters/setters in UrlQueryParams so Object.assign can be used
  let sourceIDs = SERVERS.map(s => s.id);
  let alignmentIDs = ALIGNMENT_ALGORITHMS.map(a => a.id);
  let orderIDs = ORDER_ALGORITHMS.map(o => o.id);
  let typedCopy = (target, source): void => {
    for (let prop in source) {
      if (source.hasOwnProperty(prop)) {
        switch(prop) {
          case 'neighbors':
          case 'matched':
          case 'intermediate':
          case 'match':
          case 'mismatch':
          case 'gap':
          case 'score':
          case 'threshold':
            let x = parseInt(source[prop]);
            if (Number.isInteger(x)) target[prop] = x;
            break;
          case 'sources':
            let sources = [];
            let s = source[prop];
            if (Array.isArray(s) && s.every(e => typeof e === 'string'))
              sources = s;
            else if (typeof s === 'string')
              sources = s.split(',');
            sources = sources.filter(s => sourceIDs.indexOf(s) != -1);
            if (sources.length > 0)
              target[prop] = sources;
            break
          case 'algorithm':
            let a = source[prop];
            if (typeof a === 'string' && alignmentIDs.indexOf(a) != -1)
              target[prop] = a;
            break;
          case 'regexp':
            let r = source[prop];
            if (typeof r === 'string') target[prop] = r;
            break;
          case 'order':
            let o = source[prop];
            if (typeof o === 'string' && orderIDs.indexOf(o) != -1)
              target[prop] = o;
            break;
        }
      }
    }
  }
  switch (type) {
    case ADD_QUERY_PARAMS:
      let next = Object.create(UrlQueryParams.prototype);
      typedCopy(next, state);
      typedCopy(next, payload);
      return next;
    default:
      return state;
  }
};
