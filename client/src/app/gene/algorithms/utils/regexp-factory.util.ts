import { Algorithm } from '@gcv/gene/models';
import { trackName } from './track-name.util';


function trackFilter(regexp, tracks) {
  const r = new RegExp(regexp);
  return tracks.filter((t) => r.test(trackName(t)));
}


export function regexpFactory(regexp: string): Algorithm {
  return new Algorithm('regexp', regexp, trackFilter.bind(null, regexp));
}
