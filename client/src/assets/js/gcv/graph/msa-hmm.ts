import { Directed } from "./directed";

/**
 * A specialized directed graph that implements a profile Hidden Markov Model
 * (HMM) with the canonical Multiple Sequence Alignment (MSA) topology.
 */
export class MSAHMM extends Directed {

  // static members

  static State = class {
    // [Delete]State does not know what paths traverse it because no character
    // is associated with a delete state and the traversal can be inferred from
    // the path's absence in the insert and match states in the same column.
  };

  /**
   * A class representing an insertion state in an MSA profile HMM.
   */
  static InsertState = class extends MSAHMM.State {
    paths: object;
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
  };

  /**
   * A class representing a match state in an MSA profile HMM.
   */
  static MatchState = class extends MSAHMM.State {
    paths: object;
    emissionCounts: object;
    emissionProbabilities: object;
    numObservations: number;
    countAmplifier: number;
    constructor(characters) {
      super();
      this.paths = {};
      this.emissionCounts = {};
      this.emissionProbabilities = {};
      this.numObservations = characters.size;
      this.countAmplifier = Math.pow(this.numObservations, 1.25);
      const p = 1 / this.numObservations;
      characters.forEach((o) => {
        this.emissionCounts[o] = 1;  // pseudo-count
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
      for (const c in this.emissionCounts) {
        if (this.emissionCounts.hasOwnProperty(c)) {
          const p = this.emissionCounts[c] / this.numObservations;
          this.emissionProbabilities[c] = p;
        }
      }
    }
  };

  // attributes

  private _numColumns: number;
  private _characters: Set<any>;

  // constructor

  constructor(numColumns, characters, edgeDelimiter?) {
    super(edgeDelimiter);
    this._numColumns = numColumns;
    this._characters = characters;
    this._constructModel();
  }

  // getters

  get numColumns(): number {
    return this._numColumns;
  }

  get characters(): Set<any> {
    return new Set(this._characters);
  }

  get numCharacters(): number {
    return this._characters.size;
  }

  // private operations

  private _constructModel() {
    // add nodes w/ absolute lexicographical ordering
    this.addNode("a", new MSAHMM.State());
    for (let i = 0; i < this._numColumns; i++) {
      let id = "m" + i;
      const m = new MSAHMM.MatchState(this._characters);
      this.addNode(id, m);
      id = "i" + i;
      this.addNode(id, new MSAHMM.InsertState());
      id = "d" + i;
      this.addNode(id, new MSAHMM.State());
    }
    this.addNode("i" + this._numColumns, new MSAHMM.InsertState());
    this.addNode("z", new MSAHMM.State());
    // add edges
    this.addEdge("a", "m0");
    this.addEdge("a", "i0");
    this.addEdge("a", "d0");
    for (let i = 0; i < this._numColumns; i++) {
      if (i < this._numColumns - 1) {
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
    this.addEdge("m" + (this._numColumns - 1), "i" + this._numColumns);
    this.addEdge("m" + (this._numColumns - 1), "z");
    this.addEdge("i" + this._numColumns, "i" + this._numColumns);
    this.addEdge("i" + this._numColumns, "z");
    this.addEdge("d" + (this._numColumns - 1), "i" + this._numColumns);
    this.addEdge("d" + (this._numColumns - 1), "z");
    this._updateTransitionProbabilities();
  }

  // private

  private _setOption(options: object, option: string, value: any) {
    if (options[option] === undefined ||
        typeof options[option] !== typeof value) {
      options[option] = value;
    }
  }

  private _indelTransitionProbability() {
    return 1 / (2 + this.numCharacters);
  }

  private _matchTransitionProbability() {
    return this.numCharacters / (2 + this.numCharacters);
  }

  private _updateTransitionProbabilities() {
    for (const id in this.nodes) {
      if (this.nodes.hasOwnProperty(id)) {
        this._updateNodeTransitionProbabilities(id);
      }
    }
  }

  private _updateNodeTransitionProbabilities(id) {
    if (id === "d" + (this._numColumns - 1) ||
        id === "m" + (this._numColumns - 1) ||
        id === "i" + this._numColumns) {
      const ilast = "i" + this._numColumns;
      const p = this._indelTransitionProbability();
      this.updateEdge(id, ilast, p);
      this.updateEdge(id, "z", 1 - p);
    } else {
      this.nodes[id].outNeighbors.forEach((nId) => {
        let p;
        if (nId.startsWith("m")) {
          p = this._matchTransitionProbability();
        } else {
          p = this._indelTransitionProbability();
        }
        this.updateEdge(id, nId, p);
      });
    }
  }

  /**
   * Converts the insertion states into one or more match states if traversed by
   * a path. This may invalidate previously generated paths.
   */
  private _performSurgery() {
    let growBy = 0;
    for (let j = 0; j <= this._numColumns; j += (growBy + 1)) {
      growBy = 0;
      const ipaths = this.nodes["i" + j].attr.paths;
      // if one or more paths traverses the insert state
      if (Object.keys(ipaths).length > 0) {
        // find the largest number of consecutive insertions
        for (const pId in ipaths) {
          if (ipaths.hasOwnProperty(pId)) {
            growBy = Math.max(growBy, ipaths[pId].length);
          }
        }
        // add growBy new columns to the end of the model and shift probabilities
        const l = this._numColumns;
        this._numColumns += growBy;
        for (let k = l + growBy - 1; k >= j; k--) {
          const knext  = k + 1;
          const dk = "d" + k;
          const ik = "i" + knext;
          const mk = "m" + k;
          const dknext = "d" + knext;
          const mknext = "m" + knext;
          // add new nodes and edges
          if (k >= l) {
            // add new column
            this.addNode(dk);
            this.addNode(ik);
            this.addNode(mk);
            this.addEdge(dk, ik);
            this.addEdge(ik, ik);
            this.addEdge(mk, ik);
            // add new end state transitions
            if (k === l + growBy - 1) {
              this.addEdge(dk, "z", this.removeEdge("d" + (l - 1), "z"));
              this.addEdge(ik, "z", this.removeEdge("i" + l, "z"));
              this.addEdge(mk, "z", this.removeEdge("m" + (l - 1), "z"));
            // add edges between current and previously added new column
            } else {
              this.addEdge(dk, dknext);
              this.addEdge(dk, mknext);
              this.addEdge(ik, dknext);
              this.addEdge(ik, mknext);
              this.addEdge(mk, dknext);
              this.addEdge(mk, mknext);
            }
            // add edges between old last column and first new column
            if (k === l) {
              const kprev  = k - 1;
              const dkprev = "d" + kprev;
              const ikprev = "i" + k;
              const mkprev = "m" + kprev;
              this.addEdge(dkprev, dk);
              this.addEdge(dkprev, mk);
              this.addEdge(ikprev, dk);
              this.addEdge(ikprev, mk);
              this.addEdge(mkprev, dk);
              this.addEdge(mkprev, mk);
            }
          }
          // shift the existing probabilities
          if (k >= j + growBy) {
            const shift = k - growBy;
            const shiftNext = shift + 1;
            const dshift = "d" + shift;
            const ishift = "i" + shiftNext;
            const mshift = "m" + shift;
            const dshiftNext = "d" + shiftNext;
            const mshiftNext = "m" + shiftNext;
            // shift nodes
            this.updateNode(dk, this.getNode(dshift).attr);
            this.updateNode(ik, this.getNode(ishift).attr);
            this.updateNode(mk, this.getNode(mshift).attr);
            // shift edges
            if (k < l + growBy - 1) {
              this.updateEdge(dk, dknext, this.getEdge(dshift, dshiftNext));
              this.updateEdge(dk, mknext, this.getEdge(dshift, mshiftNext));
              this.updateEdge(ik, dknext, this.getEdge(ishift, dshiftNext));
              this.updateEdge(ik, mknext, this.getEdge(ishift, mshiftNext));
              this.updateEdge(mk, dknext, this.getEdge(mshift, dshiftNext));
              this.updateEdge(mk, mknext, this.getEdge(mshift, mshiftNext));
            }
            this.updateEdge(dk, ik, this.getEdge(dshift, ishift));
            this.updateEdge(ik, ik, this.getEdge(ishift, ishift));
            this.updateEdge(mk, ik, this.getEdge(mshift, ishift));
          // generate new states
          } else {
            this.updateNode(dk, new MSAHMM.State());
            this.updateNode(ik, new MSAHMM.InsertState());
            this.updateNode(mk, new MSAHMM.MatchState(this._characters));
          }
        }
        // expand the inserted paths into the new match states
        for (const pId in ipaths) {
          if (ipaths.hasOwnProperty(pId)) {
            for (let k = 0; k < ipaths[pId].length; k++) {
              const o = ipaths[pId][k];
              const m = "m" + (j + k);
              this.nodes[m].attr.addPath(pId, o);
            }
          }
        }
        this.updateNode("i" + j, new MSAHMM.InsertState());
        // compute the transition probabilities for each inserted column
        if (j === 0) {
          this._updateNodeTransitionProbabilities("a");
        }
        for (let k = Math.max(0, j - 1); k < j + growBy; k++) {
          const dk = "d" + k;
          const ik = "i" + (k + 1);
          const mk = "m" + k;
          this._updateNodeTransitionProbabilities(dk);
          this._updateNodeTransitionProbabilities(ik);
          this._updateNodeTransitionProbabilities(mk);
        }
      }
    }
  };

  /**
   * Embeds the given sequence along the given state path in the given HMM.
   * @param{String} pId - The ID of the sequence for which the path is being
   * embedded.
   * @param{Array} path - An ordered array of state IDs describing the sequence
   * path to be embedded.
   * @param{Array} seq - An ordered array of strings representing the sequence
   * for which a path is being embedded.
   */
  private _embedPath(pId, path, seq) {
    let i = 0;
    for (let j = 0; j < path.length - 1; j++) {
      const from = path[j];
      const to   = path[j + 1];
      const n    = this.getNode(from).attr;
      if (n instanceof MSAHMM.InsertState ||
          n instanceof MSAHMM.MatchState) {
        n.addPath(pId, seq[i++]);
      }
    }
  };

  /**
   * Gets an embedded sequence"s path through the current topology of the graph.
   * @param{String} pId - The ID of the sequence for which to get the path.
   * return {Array} - An ordered array of state IDs describing the sequence path.
   */
  private _getPath(pId) {
    const path = ["a"];
    for (let j = 0; j < this._numColumns; j++) {
      const i = "i" + j;
      const ipaths = this.getNode(i).attr.paths;
      const m = "m" + j;
      const mpaths = this.getNode(m).attr.paths;
      const d = "d" + j;
      if (ipaths.hasOwnProperty(pId) || mpaths.hasOwnProperty(pId)) {
        if (ipaths.hasOwnProperty(pId)) {
          for (const p of ipaths[pId]) {
            path.push(i);
          }
        }
        if (mpaths.hasOwnProperty(pId)) {
          path.push(m);
        }
      } else {
        path.push(d);
      }
    }
    const i = "i" + this._numColumns;
    const ipaths = this.getNode(i).attr.paths;
    if (ipaths.hasOwnProperty(pId)) {
      for (const p of ipaths[pId]) {
        path.push(i);
      }
    }
    path.push("z");
    return path;
  };

  /**
   * Takes the match and insertion state emission probabilities of the paths for
   * a sequence's forward and reverse orientations and creates an orientation
   * array that describes subsequences that should be inverted to maximize the
   * alignment score.
   * @param{Array} forwardEmissions - The forward orientation's path emissions.
   * @param{Array} reverseEmissions - The reverse orientation's path emissions.
   * return{Array} - An orientation array with "f" for forward oriented members
   * and "r" for reverse oriented members.
   */
  // TODO: maybe not flip single f/r at beginning/end if it's a good match
  private _emissionsToOrientation(forwardEmissions, reverseEmissions) {
    // determine if each character was better aligned in the forward (f) or
    // reverse (r) path, or if they effectively tied (t)
    const orientations = [];
    const rlocs = [];
    const fcounts = [0];
    for (let i = 0; i < forwardEmissions.length; i++) {
      const fP = forwardEmissions[i];
      const rP = reverseEmissions[reverseEmissions.length - (i + 1)];
      if (fP > rP) {
        orientations.push("f");
        fcounts[rlocs.length] += 1;
      } else if (fP < rP) {
        orientations.push("r");
        rlocs.push(i);
        fcounts.push(0);
      } else {
        orientations.push("t");
      }
    }
    rlocs.push(forwardEmissions.length);
    fcounts.push(0);
    // resolve ties and flip characters that fracture larger blocks
    for (let i = 0; i < rlocs.length - 1; i++) {
      const l = rlocs[i];
      // convert t chains between r's with one or less f's to r's
      if (fcounts[i + 1] <= 1) {
        for (let j = l + 1; j < rlocs[i + 1]; j++) {
          orientations[j] = "r";
        }
      // flip island r's
      } else {
        if (l - 1 >= 0 && orientations[l - 1] !== "r") {
          orientations[l] = "f";
        }
        for (let j = l + 1; j < rlocs[i + 1]; j++) {
          orientations[j] = "f";
        }
      }
    }
    // get the edge case - there's an inversion at the beginning
    if (orientations[rlocs[0]] === "r" && fcounts[0] <= 1) {
      for (let j = 0; j < rlocs[0]; j++) {
        orientations[j] = "r";
      }
    } else {
      for (let j = 0; j < rlocs[0]; j++) {
        orientations[j] = "f";
      }
    }
    return orientations;
  }

  /**
   * Combines the forward and reverse paths of a sequence according to an
   * orientation array.
   * @param{Array} forwardPath - The forward oriented sequence.
   * @param{Array} reversePath - The reverse oriented sequence.
   * @param{Array} orientations - The orientation array that dictates how the
   * paths are merged.
   * return{Array} - A path corresponding to the orientation array, where "f"
   * entries are from the forwardPath and "r" entries are from the reversePath.
   */
  private _mergePaths(forwardPath, reversePath, orientations) {
    const path = ["a"];
    let i = 1;
    let j = reversePath.length-2;
    // add any deletions at beginning of forward to path and skip over deletions
    // at end of reverse path
    const consumeDeletions = (reverse) => {
        while (forwardPath[i].startsWith("d") && i < forwardPath.length) {
          if (!reverse) {
            path.push(forwardPath[i]);
          }
          i++;
        }
        while (reversePath[j].startsWith("d") && j >= 0) {
          if (reverse) {
            path.push(reversePath[j]);
          }
          j--;
        }
      };
    consumeDeletions(false);
    // combine paths based on match/insertion orientations
    orientations.forEach((o, k) => {
      const s = (o === "f") ? forwardPath[i++] : reversePath[j--];
      path.push(s);
      const reverse =
        o === "r" && k < orientations.length-1 && orientations[k+1] === "r";
      consumeDeletions(reverse);
    });
    path.push("z");
    return path;
  }

  // public

  /**
   * Computes the emission probabilities for a sequence given a path through an
   * HMM. Note: does not include deletion states so the output array should be
   * the same length as the input sequence.
   * @param{Array} seq - The sequence to compute emission probabilities for.
   * @param{Array} path - A (Viterbi) path that maps sequence members to HMM
   * match states.
   * return {Array} - A sequence of emission probabilities corresponding to seq.
   */
  sequenceEmissions(seq, path) {
    const eseq = [];
    let j = 0;
    for (let i = 1; i < path.length; i++) {
      const n = path[i];
      if (n.startsWith("m")) {
        eseq.push(this.getNode(n).attr.emit(seq[j++]));
      } else if (n.startsWith("i")) {
        eseq.push(0);
        j++;
      }
    }
    return eseq;
  };

  /**
   * A message passing implementation of the Viterbi algorithm.
   * @param{Array} seq - An ordered array of strings representing the sequence
   * for which a state path is to be computed.
   * return {Array} - An ordered array of state IDs describing the most probable
   * path of the sequence through the HMM.
   */
  viterbi(seq) {
    const probs: any = {};
    const ptrs: any = {};
    for (const id in this.nodes) {
      if (this.nodes.hasOwnProperty(id)) {
        probs[id] = {};
        ptrs[id] = {};
      }
    }
    // a generic probability forward propagate function
    const propagate = (from, to, i) => {
      const currentProb = probs[to][i] || -Infinity;
      const currentPtr = ptrs[to][i]  || "";
      let candidate = probs[from][i - (+ !to.startsWith("d"))] +  // arithmetic HACK!
                        Math.log(this.getEdge(from, to));
      if (to.startsWith("m")) {
        candidate += Math.log(this.getNode(to).attr.emit(seq[i]));
      }
      if (candidate > currentProb ||
         (candidate === currentProb && from > currentPtr)) {
        probs[to][i] = candidate;
        ptrs[to][i] = from;
      }
    };
    // recursively identifies the sequence's most probable path through the HMM
    const traceback = (id, i) => {
      if (id === "a") {
        return [id];
      }
      const ptr = ptrs[id][i];
      const path = traceback(ptr, i - (+ !id.startsWith("d")));  // arithmetic HACK!
      path.push(id);
      return path;
    };
    // seed start state
    const s = "a";
    probs[s][-1] = 0;  // = log(1)
    // propagate pre-sequence deletion probabilities
    let dj = "d0";
    propagate(s, dj, -1);
    for (let j = 1; j < this._numColumns; j++) {
      const djprev = dj;
      dj = "d" + j;
      propagate(djprev, dj, -1);
    }
    // compute one time transitions out of start state
    let ij = "i" + 0;
    const ilast = "i" + this._numColumns;
    propagate(s, ij, 0);
    let mj = "m" + 0;
    propagate(s, mj, 0);
    // propagate probabilities via Viterbi recurrence relation and message passing
    for (let i = 0; i < seq.length; i++) {
      for (let j = 0; j < this._numColumns; j++) {
        ij = "i" + j;
        dj = "d" + j;
        mj = "m" + j;
        // all transitions out of insertion j
        if (i > 0) {
          propagate(ij, ij, i);
          propagate(ij, mj, i);
        }
        propagate(ij, dj, i);
        if (j < this._numColumns - 1) {
          const djnext = "d" + (j + 1);
          const mjnext = "m" + (j + 1);
          // delete and merge transitions out of deletion j
          propagate(dj, djnext, i);
          propagate(dj, mjnext, i);
          // delete and merge transitions out of match j
          propagate(mj, djnext, i);
          propagate(mj, mjnext, i);
        }
        const ijnext = "i" + (j + 1);
        // insertion transition out of delete j
        propagate(dj, ijnext, i);
        // insertion transition out of match j
        propagate(mj, ijnext, i);
      }
      // insertion transition out of last transition
      if (i > 0) {
        propagate(ilast, ilast, i);
      }
    }
    // compute one time transitions into end state
    const e = "z";
    propagate(dj, e, seq.length);
    propagate(ilast, e, seq.length);
    propagate(mj, e, seq.length);
    // follow the pointers from the end state to the start state to get the path
    const path = traceback(e, seq.length);
    path.probability = probs.z[seq.length];
    return path;
  }

  /**
   * Train the HMM on the given sequences.
   * @param{Array} sequences - A array of sequences to train the model on (order
   * matters).
   * @param{Object} options - Optional training parameters.
   */
  train(sequences,
        options: {
          omit?: Set<any>,
          reverse?: boolean,
          surgery?: boolean,
        }={})
  {
    // parse optional parameters
    this._setOption(options, "omit", new Set());
    this._setOption(options, "reverse", true);
    this._setOption(options, "surgery", true);
    // train the model
    const filter = (sequence) => sequence.filter((s) => !options.omit.has(s));
    sequences.forEach((s, i) => {
      // generate and align training sequences
      const forward = filter(s);
      const forwardPath = this.viterbi(forward);
      const reverse = (options.reverse) ? [...forward].reverse() : [];
      const reversePath = this.viterbi(reverse);
      // embed alignment path (updates transition and emission probabilities)
      if (forwardPath.probability >= reversePath.probability) {
        this._embedPath(i, forwardPath, forward);
      } else {
        this._embedPath(i, reversePath, reverse);
      }
      // if necessary, perform surgery on the graph
      if (options.surgery) {
        this._performSurgery();
      }
    });
  }

  /**
   * Converts a path to a coordinate alignment based on the hmm columns it
   * traverses.
   * @param{Array} path - The path (e.g. Viterbi) to derive the alignment from.
   * return {Array} - The columns that each element align to in the hmm. In the
   * case of an insertion, the value will be a decimal between the flanking
   * match states.
   * Ex: [0, 1, 2, 3, 4, 5]  // a perfect alignment
   *     [0, 0.5, 1, 2, 3, 4]  // an insertion
   *     [0, 0.3, 0.6, 1, 2 ]  // sequential insertions
   *     [0, 1, 2, 5, 6, 7]  // deletions
   */
  // TODO: update to detect inversions encoded in path
  pathToAlignment(path) {
    const alignment = [];
    let insertion = 0;
    const insert = (x, reverse) => {
        let step = 1 / (insertion+1);
        if (reverse) {
          step *= -1;
        } else {
          x -= 1;
        }
        for (let i = 0; i < insertion; i++) {
          alignment.push(x+((i+1)*step));
        }
        insertion = 0;
      };
    let prev = "a0";
    let prevIndex = -1;
    for (let i = 1; i < path.length; i++) {
      const n = path[i];
      let index = parseInt(n.substr(1));
      if (index === NaN) {
        index = this.numColumns;
      }
      if (insertion > 0 &&
          (!n.startsWith("i") || (n.startsWith("i") && n !== prev))) {
        const prevIndex = parseInt(prev.substr(1));
        const index = parseInt(n.substr(1));
        const reverse = prevIndex > index;
        insert(prevIndex, reverse);
      }
      if (n.startsWith("m")) {
        alignment.push(index);
      } else if (n.startsWith("i")) {
        insertion++;
      }
      prev = n;
      prevIndex = n;
    }
    return alignment;
  }

  /**
   * Aligns a sequence to the HMM and outputs the alignment as an array with a
   * number for each element in the input sequence denoting what match or
   * insertion state in the model it aligned to.
   * @param{Array} sequence - The sequence to be aligned.
   * @param{Object} options - Optional alignment parameters.
   * return {Object} - The object representing the alignment, where the elements
   * are an alignment array containing the indices of the elements in the
   * original array and a segments array containing the segment each element
   * belongs to. null values denote deletions and decimals denote insertions.
   * Ex: [0, 1, 2, 4, 5]  // alignment with deletion
   *     [0, 0.5, 1, 3, 4]  // with insertion and deletion
   *     [0, 1, 4, 3, 2]  // with inversion
   *     [4, 3, 1, 0.5, 0]  // whole alignment is inverted and includes an
   *                        // insertion and deletion
   */
  align(sequence, options: {reverse?: boolean, inversions?: boolean}={}) {
    // parse options
    this._setOption(options, "reverse", true);
    this._setOption(options, "inversions", true);

    // compute Viterbi paths and their emission probabilities
    let forward = sequence;
    let forwardPath = this.viterbi(forward);
    let forwardEmissions = this.sequenceEmissions(forward, forwardPath);
    let reverse = (options.reverse || options.inversions) ?
      [...forward].reverse() : [];
    let reversePath = this.viterbi(reverse);
    let reverseEmissions = this.sequenceEmissions(reverse, reversePath);

    // swap orientations depending on score
    const reversed =
      options.reverse && forwardPath.probability < reversePath.probability;
    if (reversed) {
      [forward, reverse,
      forwardPath, reversePath,
      forwardEmissions, reverseEmissions] =
        [reverse, forward,
        reversePath, forwardPath,
        reverseEmissions, forwardEmissions];
    }

    // compute inversions
    let alignmentPath = forwardPath;
    if (options.inversions) {
      const orientations =
        this._emissionsToOrientation(forwardEmissions, reverseEmissions);
      alignmentPath = this._mergePaths(forwardPath, reversePath, orientations);
    }

    // convert path to hmm state independent alignment
    const alignment = {
        alignment: this.pathToAlignment(alignmentPath),
        orientations: [],
        segments: [],
        score: 0,
      };
    if (reversed) {
      alignment.alignment.reverse();
      alignment.orientations = Array(alignment.alignment.length).fill(-1);
      alignment.segments = Array(alignment.alignment.length).fill(1);
      alignment.score = reversePath.probability;
    } else {
      alignment.segments = Array(alignment.alignment.length).fill(0);
      alignment.orientations = Array(alignment.alignment.length).fill(1);
      alignment.score = forwardPath.probability;
    }

    return alignment;
  }

  /**
   * Returns the most probable sequence according to the emission probabilities
   * of the match states.
   * return {Array} - An array with an entry for each match state where the
   * values correspond to the state most probable character emission.
   */
  // TODO: should this allow match nodes to emit more than one value if their
  // probabilities are close/equal?
  consensus() {
    const reducer = (prev, [c, p]): [any, {}] => {
        const [cMax, pMax] = prev;
        if (p > pMax) {
          return [c, p];
        }
        return [cMax, pMax];
      };
    const sequence = [];
    for (let i = 0; i < this._numColumns; i++) {
      const matchState = this.getNode("m" + i);
      const probs = matchState.attr.emissionProbabilities;
      const [c, p] = Object.entries(probs).reduce(reducer);
      sequence.push(c);
    }
    return sequence;
  }

}
