import { AppConfig } from '@gcv/app.config';
import { Params } from '@gcv/gene/models/params';


export const initialState: Params = {
  // alignment
  algorithm:  'repeat',
  match: 10,
  mismatch: -1,
  gap: -1,
  score: 30,
  threshold: 25,
  // block
  bmatched: 20,
  bintermediate: 10,
  bmask: 10,
  // clustering
  linkage: 'average',  // TODO: remove magic string
  cthreshold: 20,
  // query
  neighbors: 10,
  matched: 4,
  intermediate: 5,
  // sources
  sources: AppConfig.SERVERS.map((s) => s.id),
  // macro filters
  bregexp: '',
  border: 'chromosome',
  // micro filters
  regexp: '',
  order: 'distance',
};
