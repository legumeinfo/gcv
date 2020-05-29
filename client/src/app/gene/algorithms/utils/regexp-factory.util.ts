import { Algorithm } from '@gcv/gene/models';
import { pairwiseBlocksName } from './pairwise-blocks-name.util';
import { trackName } from './track-name.util';


function trackFilter(regexp, toString, tracks) {
  let r;
  try {
    r = new RegExp(regexp);
  } catch (e) {
    r = new RegExp('');
  }
  return tracks.filter((t) => r.test(toString(t)));
}


export function microRegexpFactory(regexp: string): Algorithm {
  const algorithm = trackFilter.bind(null, regexp, trackName);
  return new Algorithm('microregexp', regexp, algorithm);
}


export function macroRegexpFactory(regexp: string): Algorithm {
  const algorithm = trackFilter.bind(null, regexp, pairwiseBlocksName);
  return new Algorithm('macroregexp', regexp, algorithm);
}
