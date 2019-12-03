import { Pair } from './pair.model';
import { Track } from './track.model';
import { ClusterMixin } from './mixins/cluster.model';


export class Plot {

  reference: (Track | ClusterMixin);
  sequence: Track;
  pairs: Pair[];
  omit: Set<string>

  constructor(
    reference: (Track | ClusterMixin),
    sequence: Track,
    omit=new Set(['']))
  {
    this.reference = reference;
    this.sequence = sequence;
    this.omit = omit;
    this.makePairs();
  }

  makePairs(): void {
    const familyIndexMap = {};
    this.sequence.families.forEach((f, i) => {
      if (!this.omit.has(f)) {
        if (!(f in familyIndexMap)) {
          familyIndexMap[f] = [];
        }
        familyIndexMap[f].push(i);
      }
    });
    const reducer = (accumulator, f, i) => {
        if (f in familyIndexMap) {
          familyIndexMap[f].forEach((j) => {
            const pair = new Pair(i, j);
            accumulator.push(pair);
          });
        }
        return accumulator;
      };
    this.pairs = (this.reference as Track).families.reduce(reducer, []);
  }
}
