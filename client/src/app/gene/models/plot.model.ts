import { Pair } from './pair.model';
import { Track } from './track.model';
import { ClusterMixin } from './mixins/cluster.model';


export class Plot {
  constructor(reference: (Track | ClusterMixin), sequence: Track) {
    this.reference = reference;
    this.sequence = sequence;
    this.pairs = [];
  }
  reference: (Track | ClusterMixin);
  sequence: Track;
  pairs: Pair[];
}
