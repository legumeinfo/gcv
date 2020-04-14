import { Pair } from './pair.model';
import { Track } from './track.model';
import { ClusterMixin } from './mixins/cluster.model';


// TODO: redefine as object type literal with factory for instantiation that
// makes pairs and helper for source gene map
export class Plot {

  reference: (Track & ClusterMixin);
  sequence: Track;
  pairs: Pair[];
  omit: Set<string>

  constructor(
    reference: (Track & ClusterMixin),
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
    this.pairs = this.reference.families.reduce(reducer, []);
  }

  sourceGeneMap(): {[key: string]: string[]} {
    const sourceGeneMap: {[key: string]: string[]} = {};
    const refSource = this.reference.source;
    const seqSource = this.sequence.source;
    sourceGeneMap[refSource] = [];
    sourceGeneMap[seqSource] = [];
    this.pairs.forEach((p) => {
      const refGene = this.reference.genes[p.i];
      sourceGeneMap[refSource].push(refGene);
      const seqGene = this.sequence.genes[p.j];
      sourceGeneMap[seqSource].push(seqGene);
    });
    return sourceGeneMap;
  }
}
