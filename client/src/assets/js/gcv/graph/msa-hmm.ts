import { Directed } from './directed';


/**
  * A specialized directed graph that implements a profile Hidden Markov Model
  * (HMM) with the canonical Multiple Sequence Alignment (MSA) topology.
  */
export class MSAHMM extends Directed {
  numColumns: number;
  characters: Set<any>;
  numCharacters: number;
  constructor(numColumns, characters, edgeDelimiter?) {
    super(edgeDelimiter)
    this.numColumns      = numColumns;
    this.characters      = characters;
    this.numCharacters   = characters.size;
    this.constructModel(characters);
  }
  static State = class {
    // [Delete]State does not know what paths traverse it because no character
    // is associated with a delete state and the traversal can be inferred from
    // the path's absence in the insert and match states in the same column.
    constructor() { }
  }
  /**
    * A class representing an insertion state in an MSA profile HMM.
    */
  static InsertState = class extends MSAHMM.State {
    paths: Object;
    constructor() {
      super();
      this.paths = {};
    }
    addPath(pId, o) {
      if (!this.paths.hasOwnProperty(pId)) {
        this.paths[pId] = [];
      }
      this.paths[pId].push(o);
    }
  }
  /**
    * A class representing a match state in an MSA profile HMM.
    */
  static MatchState = class extends MSAHMM.State {
    paths: Object;
    emissionCounts: Object;
    emissionProbabilities: Object;
    numObservations: number;
    countAmplifier: number;
    constructor(characters) {
      super();
      this.paths                  = {};
      this.emissionCounts         = {};
      this.emissionProbabilities  = {};
      this.numObservations        = characters.size;
      this.countAmplifier         = Math.pow(this.numObservations, 1.25);
      var p                       = 1 / this.numObservations;
      characters.forEach((o) => {
        this.emissionCounts[o]        = 1;  // pseudo-count
        this.emissionProbabilities[o] = p;
      });
    }
    emit(o) {
      return this.emissionProbabilities[o] || 0;
    }
    addPath(pId, o) {
      this.paths[pId] = o;
      this.emissionCounts[o] += this.countAmplifier;
      this.numObservations   += this.countAmplifier;
      for (let o in this.emissionCounts) {
        if (this.emissionCounts.hasOwnProperty(o)) {
          var p = this.emissionCounts[o] / this.numObservations;
          this.emissionProbabilities[o] = p;
        }
      }
    }
  }
  // hmm operations
  constructModel(characters) {
    // add nodes w/ absolute lexicographical ordering
    this.addNode("a", new MSAHMM.State());
    for (var i = 0; i < this.numColumns; i++) {
      var id = "m" + i,
          m  = new MSAHMM.MatchState(characters);
      this.addNode(id, m);
      id = "i" + i;
      this.addNode(id, new MSAHMM.InsertState());
      id = "d" + i;
      this.addNode(id, new MSAHMM.State());
    }
    this.addNode("i" + this.numColumns, new MSAHMM.InsertState());
    this.addNode("z", new MSAHMM.State());
    // add edges
    this.addEdge("a", "m0");
    this.addEdge("a", "i0");
    this.addEdge("a", "d0");
    for (var i = 0; i < this.numColumns; i++) {
      if (i < this.numColumns - 1) {
        this.addEdge("m" + i, "m" + (i + 1));
        this.addEdge("m" + i, "i" + (i + 1));
        this.addEdge("m" + i, "d" + (i + 1));
        this.addEdge("d" + i, "d" + (i + 1));
        this.addEdge("d" + i, "m" + (i + 1));
        this.addEdge("d" + i, "i" + (i + 1));
      }
      this.addEdge("i" + i, "i" + i);
      this.addEdge("i" + i, "m" + i);
      this.addEdge("i" + i, "d" + i);
    }
    this.addEdge("m" + (this.numColumns - 1), "i" + this.numColumns);
    this.addEdge("m" + (this.numColumns - 1), "z");
    this.addEdge("i" + this.numColumns, "i" + this.numColumns);
    this.addEdge("i" + this.numColumns, "z");
    this.addEdge("d" + (this.numColumns - 1), "i" + this.numColumns);
    this.addEdge("d" + (this.numColumns - 1), "z");
    this.updateTransitionProbabilities();
  }
  indelTransitionProbability() {
    return 1 / (2 + this.numCharacters);
  }
  matchTransitionProbability() {
    return this.numCharacters / (2 + this.numCharacters);
  }
  updateTransitionProbabilities() {
    for (var id in this.nodes) {
      if (this.nodes.hasOwnProperty(id)) {
        this.updateNodeTransitionProbabilities(id);
      }
    }
  }
  updateNodeTransitionProbabilities(id) {
    if (id == "d" + (this.numColumns - 1) ||
        id == "m" + (this.numColumns - 1) ||
        id == "i" + this.numColumns) {
      var ilast = "i" + this.numColumns,
          p     = this.indelTransitionProbability();
      this.updateEdge(id, ilast, p);
      this.updateEdge(id, "z", 1 - p);
    } else {
      this.nodes[id].outNeighbors.forEach((nId) => {
        var p;
        if (nId.startsWith("m")) {
          p = this.matchTransitionProbability();
        } else {
          p = this.indelTransitionProbability();
        }
        this.updateEdge(id, nId, p);
      });
    }
  }
}
