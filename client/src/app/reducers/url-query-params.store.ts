import { StoreActions }         from '../constants/store-actions';
import { ALIGNMENT_ALGORITHMS } from '../constants/alignment-algorithms';
import { AppConfig }            from '../app.config';
import { ORDER_ALGORITHMS }     from '../constants/order-algorithms';
import { UrlQueryParams }       from '../models/url-query-params.model';

export const urlQueryParams = (state: any = Object.create(UrlQueryParams.prototype),
{type, payload}) => {
  // TODO: add getters/setters in UrlQueryParams so Object.assign can be used
  switch (type) {
    case StoreActions.ADD_QUERY_PARAMS:
      // how params are copied to the url
      let sourceIDs = AppConfig.SERVERS.map(s => s.id);
      let alignmentIDs = ALIGNMENT_ALGORITHMS.map(a => a.id);
      let orderIDs = ORDER_ALGORITHMS.map(o => o.id);
      let typedCopy = (target, source): void => {
        for (let prop in source) {
          if (source.hasOwnProperty(prop)) {
            switch(prop) {
              case 'bmatched':
              case 'bintermediate':
              case 'bmask':
              case 'neighbors':
              case 'matched':
              case 'intermediate':
              case 'match':
              case 'mismatch':
              case 'gap':
              case 'score':
              case 'threshold':
              case 'kappa':
              case 'minsup':
              case 'minsize':
                let x = parseInt(source[prop]);
                if (Number.isInteger(x)) target[prop] = x;
                break;
              case 'alpha':
                let y = parseFloat(source[prop]);
                if (Number(y) === y && y > 0 && y <= 1) target[prop] = y;
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
      // compute next url params state
      let next = Object.create(UrlQueryParams.prototype);
      typedCopy(next, state);
      typedCopy(next, payload);
      return next;
    default:
      return state;
  }
};
