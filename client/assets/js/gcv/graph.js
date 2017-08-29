'use strict'

/** The Graph namespace. */
var Graph = Graph || {};


/**
  * An effectively abstract class describing what it means to be a graph.
  */
Graph.Graph = class {
  constructor(edgeDelimiter) {
    if (new.target === Graph.Graph) {
      throw new TypeError("Cannot construct Graph instances directly");
    }
    this.checkStaticOverride("Node");
    this.checkOverride("removeNodeEdges");
    this.checkOverride("addEdge");
    this.checkOverride("updateEdge");
    this.checkOverride("removeEdge");
    this.checkOverride("getEdge");
    this.ed    = edgeDelimiter || ":";
    this.nodes = {};
    this.edges = {};
  }
  // primitive operations
  checkStaticOverride(attr) {
    if (this.constructor[attr] === undefined) {
      throw new TypeError(this.constructor.name + " must override static attribute: " + attr);
    }
  }
  checkOverride(attr) {
    if (this[attr] === undefined) {
      throw new TypeError(this.constructor.name + " must override attribute: " + attr);
    }
  }
  addNode(id, attr) {
    if (!this.nodes.hasOwnProperty(id)) {
      this.nodes[id] = new this.constructor.Node(attr);
    } return this.getNode(id);
  }
  updateNode(id, attr) {
    if (this.nodes.hasOwnProperty(id)) {
      this.nodes[id].attr = attr;
    }
  }
  removeNode(id) {
    if (this.nodes.hasOwnProperty(id)) {
      this.removeNodeEdges(id);
      delete this.nodes[id];
    }
  }
  getNode(id) {
    if (this.nodes.hasOwnProperty(id)) {
      return this.nodes[id];
    } return null;
  }
}


/**
  * An effectively abstract class describing what it means to be a graph node.
  */
Graph.Node = class {
  constructor(attr) {
    if (new.target === Graph.Node) {
      throw new TypeError("Cannot construct Node instances directly");
    }
    this.attr = attr;
  }
}


/**
  * A directed graph that implements the abstract Graph class.
  */
Graph.Directed = class extends Graph.Graph {
  constructor(edgeDelimiter) {
    super(edgeDelimiter);
  }
  static Node = class extends Graph.Node {
    constructor(attr) {
      super(attr);
      this.inNeighbors  = new Set();
      this.outNeighbors = new Set();
    }
  }
  // primitive operations
  removeNodeEdges(id) {
    this.nodes[id].outNeighbors.forEach((v) => {
      this.removeEdge(id, v);
    });
    this.nodes[id].inNeighbors.forEach((v) => {
      this.removeEdge(v, id);
    });
  }
  getEdgeId(u, v) {
    return u + this.ed + v;
  }
  addEdge(u, v, attr) {
    var e = this.getEdgeId(u, v);
    if (!this.edges.hasOwnProperty(e)) {
      this.nodes[u].outNeighbors.add(v);
      this.nodes[v].inNeighbors.add(u);
      this.edges[e] = attr;
    }
  }
  updateEdge(u, v, attr) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      this.edges[e] = attr;
    }
  }
  removeEdge(u, v) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      var attr = this.edges[e];
      delete this.edges[e];
      this.nodes[u].outNeighbors.delete(v);
      this.nodes[v].inNeighbors.delete(u);
      return attr;
    } return null;
  }
  getEdge(u, v) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      return this.edges[e];
    } return null;
  }
}


/**
  * An undirected graph that implements the abstract Graph class.
  */
Graph.Undirected = class extends Graph.Graph {
  constructor(edgeDelimiter) {
    super(edgeDelimiter);
  }
  static Node = class extends Graph.Node {
    constructor(attr) {
      super(attr);
      this.neighbors = new Set();
    }
  }
  // primitive operations
  removeNodeEdges(id) {
    this.nodes[id].neighbors.forEach((v) => {
      this.removeEdge(id, v);
    });
  }
  getEdgeId(u, v) {
    return (u < v) ? u + this.ed + v : v + this.ed + u;
  }
  addEdge(u, v, attr) {
    var e = this.getEdgeId(u, v);
    if (!this.edges.hasOwnProperty(e)) {
      this.nodes[u].neighbors.add(v);
      this.nodes[v].neighbors.add(u);
      this.edges[e] = attr;
    }
  }
  updateEdge(u, v, attr) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      this.edges[e] = attr;
    }
  }
  removeEdge(u, v) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      var attr = this.edges[e];
      delete this.edges[e];
      this.nodes[u].neighbors.delete(v);
      this.nodes[v].neighbors.delete(u);
      return attr;
    } return null;
  }
  getEdge(u, v) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      return this.edges[e];
    } return null;
  }
  // additional operations
  /**
    * Contracts the given edge into a single vertex, reusing the smaller ID.
    * @param {id} u - First node of the edge.
    * @param {id} v - Second node of the edge.
    * @param {function} [contractF=function(uAttr, vAttr, eAttr) { return
    * undefined }]] - Computes the attr of the merged vertices.
    * @param {function} [updateF=function(contractF(...), wAttr, eAttr) { return
    * undefined }] - How to update the attr of affected edges.
    */
  contractEdge(u, v, contractF, updateF) {
    var e = this.getEdge(u, v);
    if (e != null) {
      var [keep, remove] = (u < v) ? [u, v] : [v, u],
          keepNode       = this.getNode(keep),
          removeNode     = this.getNode(remove);
      keepNode.attr = contractF(keepNode.attr, removeNode.attr, e);
      // update "keep" edges
      keepNode.neighbors.forEach((w) => {
        if (w != remove) {
          var wAttr = this.getNode(w).attr,
              eAttr = this.getEdge(keep, w),
              attr = updateF(keepNode.attr, wAttr, eAttr);
          this.updateEdge(keep, w, attr);
        }
      });
      // replace "remove" edges
      removeNode.neighbors.forEach((w) => {
        if (w != keep && this.getEdge(keep, w) == null) {
          var wAttr = this.getNode(w).attr,
              eAttr = this.getEdge(remove, w),
              attr = updateF(keepNode.attr, wAttr, eAttr);
          this.addEdge(keep, w, attr);
        }
      });
      this.removeNode(remove);
    }
  }
}


/**
  * A class that represents a Frequented Region.
  */
Graph.FR = class {
  constructor(nodes) {
    this.nodes = nodes || [];
    this.descendants = [];
    this.paths       = {};
    this.intervals   = {};
    this.supporting  = {};
  }
  addToPath(pId, n, kappa) {
    if (!this.paths.hasOwnProperty(pId)) {
      this.paths[pId] = [];
    }
    this.paths[pId].push(n)
    if (!this.intervals.hasOwnProperty(pId)) {
      this.intervals[pId] = [];
    }
    var halfKappa = kappa / 2;
    // (begin, end, nodes spanned)
    this.intervals[pId].push([n - halfKappa, n + halfKappa, 1])
  }
  mergeIntervals(hardSpan) {
    var comparePoints = function(a, b) {
      var [ap, ac, as] = a,
          [bp, bc, bs] = b;
      if (ap < bp || (ap == bp && ac > bc)) {
        return -1;
      } else if (bp < ap || (bp == ap && bc > ac)) {
        return 1;
      } return 0;
    }
    for (var pId in this.intervals) {
      if (this.intervals.hasOwnProperty(pId)) {
        var points = [];
        for (var i = 0; i < this.intervals[pId].length; i++) {
          var [begin, end, span] = this.intervals[pId][i];
          points.push([begin, 1, span])
          points.push([end, -1, 0])
        }
        points.sort(comparePoints)
        var combinedIntervals = [],
            counter           = 0,
            begin             = 0,
            span              = 0;
        for (var i = 0; i < points.length; i++) {
          var [p, c, s] = points[i];
          if (counter == 0) {
            begin = p
            span = 0
          }
          counter += c
          span += s
          if (counter == 0) {
            combinedIntervals.push([begin, p, hardSpan || span])
          }
        }
        this.intervals[pId] = combinedIntervals;
      }
    }
  }
  computeSupport(alpha, hardSpan) {
    this.mergeIntervals(hardSpan);
    this.supporting = [];
    for (var pId in this.intervals) {
      if (this.intervals.hasOwnProperty(pId)) {
        for (var i = 0; i < this.intervals[pId].length; i++) {
          if (this.intervals[pId][i][2] / this.nodes.length >= alpha) {
            this.supporting.push(pId);
            break;
          }
        }
      }
    }
  }
  merge(other) {
    var fr = new Graph.FR()
    fr.nodes       = this.nodes.concat(other.nodes);
    fr.descendants = [this, other]
    fr.paths       = Object.assign({}, this.paths);
    fr.intervals   = Object.assign({}, this.intervals);
    for (var id in other.paths) {
      if (fr.paths.hasOwnProperty(id)) {
        fr.paths[id] = fr.paths[id].concat(other.paths[id]);
      } else {
        fr.paths[id] = other.paths[id].slice();
      }
    }
    for (var id in other.intervals) {
      if (fr.intervals.hasOwnProperty(id)) {
        fr.intervals[id] = fr.intervals[id].concat(other.intervals[id]);
      } else {
        fr.intervals[id] = other.intervals[id].slice();
      }
    }
    return fr;
  }
}


/**
  * The Frequented Regions Algorithm  (Cleary, et al, ACM-BCB 2017).
  * @param {object} tracks - GCV track data.
  * @param {number} alpha - Fraction of region nodes a supporting path must
  * traverse.
  * @param {number} kappa - Maximum insertion size.
  * @param {number} minsup - Minimum number of paths that must support of region
  * for it to be considered frequent.
  * @param {number} minsize - Minimum size (number of nodes) of a region to be
  * considered frequent.
  * @param {object} options - Optional parameters.
  * @return {Array<FRs>} - An array of FR hierarchies.
  */
Graph.frequentedRegions =
function(tracks, alpha, kappa, minsup, minsize, options) {
  var omit = options.omit || [];
  var contractF = function(uFR, vFR, eFR) {
    return eFR;
  }
  var updateF = function(uFR, vFR, eFR) {
    var fr = uFR.merge(vFR);
    fr.computeSupport(alpha);
    return fr;
  }
  var findFRs = function(root, minsup, minsize, prevsup) {
    var frs = [];
    var sup = prevsup;
    if (root.nodes.length >= minsize && root.supporting.length >= minsup &&
    root.supporting.length > prevsup) {
      frs.push(root);
      sup = root.supporting.length;
    }
    if (root.descendants.length > 0) {
      root.descendants = findFRs(root.descendants[0], minsup, minsize, sup)
                 .concat(findFRs(root.descendants[1], minsup, minsize, sup));
    }
    if (frs.length > 0) {
      return frs;
    } return root.descendants;
  }
  // build a gene family FR graph
  var g = new Graph.Undirected()
  // add nodes with FRs as attributes
  for (var i = 0; i < tracks["groups"].length; i++) {
    for (var j = 0; j < tracks["groups"][i]["genes"].length; j++) {
      var id = tracks["groups"][i]["genes"][j]["family"];
      if (omit.indexOf(id) == -1) {
        var n = g.getNode(id);
        if (n == null) {
          n = g.addNode(id, new Graph.FR([id]));
        }
        n.attr.addToPath(i, j, kappa)
      }
    }
  }
  for (var id in g.nodes) {
    g.nodes[id].attr.computeSupport(alpha, 1);
  }
  // add edges with FRs resulting from contraction as attributes
  for (var i = 0; i < tracks["groups"].length; i++) {
    for (var j = 0; j < tracks["groups"][i]["genes"].length - 1; j++) {
      var id  = tracks["groups"][i]["genes"][j]["family"],
          n   = g.getNode(id),
          id2 = tracks["groups"][i]["genes"][j + 1]["family"],
          n2  = g.getNode(id2);
      if (g.getEdge(id, id2) == null && id != id2 &&  // TODO: handle copies!
      omit.indexOf(id) == -1 && omit.indexOf(id2) == -1) {
        g.addEdge(id, id2, updateF(n.attr, n2.attr));
      }
    }
  }
  // iteratively contract edges in most support first order
  var fr = null;
  while (Object.keys(g.edges).length > 1) {
    // find max edge weight
    var maxFR = null,
        maxE  = null;
    for (var e in g.edges) {
      if (g.edges.hasOwnProperty(e) && (maxFR == null ||
      maxFR.supporting.length < g.edges[e].supporting.length)) {
        maxFR = g.edges[e];
        maxE  = e;
      }
    }
    fr = maxFR;
    var [u, v] = maxE.split(g.ed);
    // contract edge
    g.contractEdge(u, v, contractF, updateF);
  }
  // return interesting FRs identified by traversing hierarchy
  return (fr !== null) ? findFRs(fr, minsup, minsize, 0) : [];
}


/**
  * A specialized directed graph that implements a profile Hidden Markov Model
  * (HMM) with the canonical Multiple Sequence Alignment (MSA) topology.
  */
Graph.MSAHMM = class extends Graph.Directed {
  constructor(numColumns, characters, edgeDelimiter) {
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
  // primitive operations
  addEdge(u, v, attr) {
    super.addEdge(u, v, attr);
  }
  removeEdge(u, v) {
    return super.removeEdge(u, v);
  }
  // hmm operations
  constructModel(characters) {
    // add nodes w/ absolute lexicographical ordering
    this.addNode("a", new Graph.MSAHMM.State());
    for (var i = 0; i < this.numColumns; i++) {
      var id = "m" + i,
          m  = new Graph.MSAHMM.MatchState(characters);
      this.addNode(id, m);
      id = "i" + i;
      this.addNode(id, new Graph.MSAHMM.InsertState());
      id = "d" + i;
      this.addNode(id, new Graph.MSAHMM.State());
    }
    this.addNode("i" + this.numColumns, new Graph.MSAHMM.InsertState());
    this.addNode("z", new Graph.MSAHMM.State());
    // add edges
    this.addEdge("a", "m0");
    this.addEdge("a", "i0");
    this.addEdge("a", "d0");
    for (var i = 0; i < this.numColumns - 1; i++) {
      this.addEdge("m" + i, "m" + (i + 1));
      this.addEdge("m" + i, "i" + (i + 1));
      this.addEdge("m" + i, "d" + (i + 1));
      this.addEdge("i" + i, "i" + i);
      this.addEdge("i" + i, "m" + i);
      this.addEdge("i" + i, "d" + i);
      this.addEdge("d" + i, "d" + (i + 1));
      this.addEdge("d" + i, "m" + (i + 1));
      this.addEdge("d" + i, "i" + (i + 1));
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
      this.nodes[id].outNeighbors.forEach((nId) => {
        this.updateEdge(id, nId, 1 / 2);
      });
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


/**
  * A class representing an insertion state in an MSA profile HMM.
  */
Graph.MSAHMM.InsertState = class extends Graph.MSAHMM.State {
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
Graph.MSAHMM.MatchState = class extends Graph.MSAHMM.State {
  constructor(characters) {
    super();
    this.paths                  = {};
    this.emissionCounts         = {};
    this.emissionProbabilities  = {};
    this.numObservations        = characters.size;
    this.countAmplifier         = this.numObservations;
    var p                       = 1 / this.numObservations;
    characters.forEach((o) => {
      this.emissionCounts[o]        = 1;  // pseudo-count
      this.emissionProbabilities[o] = p;
    });
  }
  emit(o) {
    return this.emissionProbabilities[o];
  }
  addPath(pId, o) {
    this.paths[pId] = o;
    this.emissionCounts[o] += this.countAmplifier;
    this.numObservations   += this.countAmplifier;
    for (var o in this.emissionCounts) {
      if (this.emissionCounts.hasOwnProperty(o)) {
        var p = this.emissionCounts[o] / this.numObservations;
        this.emissionProbabilities[o] = p;
      }
    }
  }
}


/**
  * A message passing implementation of the Viterbi algorithm.
  * @param{MSAHMM} hmm - The HMM in which to find the optimal path.
  * @param{Array} seq - An ordered array of strings representing the sequence
  * for which a state path is to be computed.
  * return {Array} - An ordered array of state IDs describing the most sequence
  * path through the HMM.
  */
Graph.MSAHMM.viterbi = function(hmm, seq) {
  var probs = {},
      ptrs  = {};
  for (var id in hmm.nodes) {
    if (hmm.nodes.hasOwnProperty(id)) {
      probs[id] = {};
      ptrs[id]  = {};
    }
  }
  // a generic probability forward propagate function
  var propagate = function(from, to, i) {
    var currentProb = probs[to][i] || -Infinity,
        currentPtr  = ptrs[to][i]  || "",
        candidate   = probs[from][i - !to.startsWith("d")] +  // arithmetic HACK!
                      Math.log(hmm.getEdge(from, to));
    if (to.startsWith("m")) {
      candidate += Math.log(hmm.getNode(to).attr.emit(seq[i]));
    }
    if (candidate > currentProb ||
       (candidate == currentProb && from > currentPtr)) {
      probs[to][i] = candidate;
      ptrs[to][i]  = from;
    }
  }
  // recursively identifies the sequence's most probable path through the HMM
  var traceback = function(id, i) {
    if (id == "a") {
      return [id];
    }
    var ptr = ptrs[id][i],
        path = traceback(ptr, i - !id.startsWith("d"));  // arithmetic HACK!
    path.push(id);
    return path;
  }
  // seed start state
  var s = "a";
  probs[s][-1] = 0;  // = log(1)
  // propagate pre-sequence deletion probabilities
  var dj = "d0";
  propagate(s, dj, -1);
  for (var j = 1; j < hmm.numColumns; j++) {
    var djprev = dj,
        dj     = "d" + j;
    propagate(djprev, dj, -1);
  }
  // compute one time transitions out of start state
  var ij = "i" + 0,
      ilast = "i" + hmm.numColumns;
  propagate(s, ij, 0);
  var mj = "m" + 0;
  propagate(s, mj, 0);
  // propagate probabilities via Viterbi recurrence relation and message passing
  for (var i = 0; i < seq.length; i++) {
    for (var j = 0; j < hmm.numColumns; j++) {
      ij = "i" + j;
      dj = "d" + j;
      mj = "m" + j;
      // all transitions out of insertion j
      if (i > 0) {
        propagate(ij, ij, i);
        propagate(ij, mj, i);
      }
      propagate(ij, dj, i);
      if (j < hmm.numColumns - 1) {
        var djnext = "d" + (j + 1);
        var mjnext = "m" + (j + 1);
        // delete and merge transitions out of deletion j
        propagate(dj, djnext, i);
        propagate(dj, mjnext, i);
        // delete and merge transitions out of match j
        propagate(mj, djnext, i);
        propagate(mj, mjnext, i);
      }
      var ijnext = "i" + (j + 1);
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
  // compute one time transitions out of start state
  var e = "z";
  propagate(dj, e, seq.length);
  propagate(ilast, e, seq.length);
  propagate(mj, e, seq.length);
  // follow the pointers from the end state to the start state to get the path
  var path = traceback(e, seq.length);
  path.probability = probs["z"][seq.length];
  return path;
}


/**
  * Embeds the given sequence along the given state path in the given HMM.
  * @param{MSAHMM} hmm - The HMM in which to embed the sequence path.
  * @param{String} pId - The ID of the sequence for which the path is being
  * embedded.
  * @param{Array} path - An ordered array of state IDs describing the sequence
  * path to be embedded.
  * @param{Array} seq - An ordered array of strings representing the sequence
  * for which a path is being embedded.
  */
Graph.MSAHMM.embedPath = function(hmm, pId, path, seq) {
  var i = 0;
  for (var j = 0; j < path.length - 1; j++) {
    var from = path[j],
        to   = path[j + 1],
        n    = hmm.getNode(from).attr;
    if (n instanceof Graph.MSAHMM.InsertState ||
        n instanceof Graph.MSAHMM.MatchState) {
      n.addPath(pId, seq[i++]);
    }
  }
}


/**
  * Gets an embedded sequence's path through the current topology of the graph.
  * @param{MSAHMM} hmm - The HMM to find the path through.
  * @param{String} pId - The ID of the sequence for which to get the path.
  * return {Array} - An ordered array of state IDs describing the sequence path.
  */
Graph.MSAHMM.getPath = function(hmm, pId) {
  var path = ["a"];
  for (var j = 0; j < hmm.numColumns; j++) {
    var i      = "i" + j,
        ipaths = hmm.getNode(i).attr.paths,
        m      = "m" + j,
        mpaths = hmm.getNode(m).attr.paths,
        d      = "d" + j;
    if (ipaths.hasOwnProperty(pId) || mpaths.hasOwnProperty(pId)) {
      if (ipaths.hasOwnProperty(pId)) {
        for (var k = 0; k < ipaths[pId].length; k++) {
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
  var i      = "i" + hmm.numColumns,
      ipaths = hmm.getNode(i).attr.paths;
  if (ipaths.hasOwnProperty(pId)) {
    for (var k = 0; k < ipaths[pId].length; k++) {
      path.push(i);
    }
  }
  path.push("z");
  return path;
}


/**
  * Converts the insertion states into one or more match states if  traversed by
  * a path. This may invalidate previously generated paths.
  * @param {MSAHMM} hmm - The model to perform surgery one.
  */
Graph.MSAHMM.performSurgery = function(hmm) {
  var growBy = 0;
  for (var j = 0; j <= hmm.numColumns; j += (growBy + 1)) { 
    growBy = 0;
    var ipaths = hmm.nodes["i" + j].attr.paths;
    // if one or more paths traverses the insert state
    if (Object.keys(ipaths).length > 0) {
      // find the largest number of consecutive insertions
      for (var pId in ipaths) {
        if (ipaths.hasOwnProperty(pId)) {
          growBy = Math.max(growBy, ipaths[pId].length);
        }
      }
      // add growBy new columns to the end of the model and shift probabilities
      var l = hmm.numColumns;
      for (var k = l + growBy - 1; k >= j; k--) {
        var knext  = k + 1,
            dk     = "d" + k,
            ik     = "i" + knext,
            mk     = "m" + k,
            dknext = "d" + knext,
            mknext = "m" + knext;
        // add new nodes and edges
        if (k >= l - 1) {
          // add a new column
          if (k >= l) {
            hmm.addNode(dk);
            hmm.addNode(ik);
            hmm.addNode(mk);
            hmm.addEdge(dk, ik);
            hmm.addEdge(ik, ik);
            hmm.addEdge(mk, ik);
          }
          // connect this and the next column
          if (k == l + growBy - 1) {
            hmm.addEdge(dk, "z");
            hmm.addEdge(ik, "z");
            hmm.addEdge(mk, "z");
          } else {
            hmm.addEdge(dk, dknext);
            hmm.addEdge(dk, mknext);
            hmm.addEdge(ik, dknext);
            hmm.addEdge(ik, mknext);
            hmm.addEdge(mk, dknext);
            hmm.addEdge(mk, mknext);
          }
        }
        // shift the existing probabilities
        if (k >= j + growBy) {
          var shift      = k - growBy,
              shiftNext  = shift + 1,
              dshift     = "d" + shift,
              ishift     = "i" + shiftNext,
              mshift     = "m" + shift,
              dshiftNext = "d" + shiftNext,
              mshiftNext = "m" + shiftNext;
          // shift nodes
          hmm.updateNode(dk, hmm.getNode(dshift).attr);
          hmm.updateNode(ik, hmm.getNode(ishift).attr);
          hmm.updateNode(mk, hmm.getNode(mshift).attr);
          // shift edges
          if (k == l + growBy - 1) {
            hmm.updateEdge(dk, "z", hmm.removeEdge(dshift, "z"));
            hmm.updateEdge(ik, "z", hmm.removeEdge(ishift, "z"));
            hmm.updateEdge(mk, "z", hmm.removeEdge(mshift, "z"));
          } else {
            hmm.updateEdge(dk, dknext, hmm.getEdge(dshift, dshiftNext));
            hmm.updateEdge(dk, mknext, hmm.getEdge(dshift, mshiftNext));
            hmm.updateEdge(ik, dknext, hmm.getEdge(ishift, dshiftNext));
            hmm.updateEdge(ik, mknext, hmm.getEdge(ishift, mshiftNext));
            hmm.updateEdge(mk, dknext, hmm.getEdge(mshift, dshiftNext));
            hmm.updateEdge(mk, mknext, hmm.getEdge(mshift, mshiftNext));
          }
          hmm.updateEdge(dk, ik, hmm.getEdge(dshift, ishift));
          hmm.updateEdge(ik, ik, hmm.getEdge(ishift, ishift));
          hmm.updateEdge(mk, ik, hmm.getEdge(mshift, ishift));
        // generate new states
        } else {
          hmm.updateNode(dk, new Graph.MSAHMM.State());
          hmm.updateNode(ik, new Graph.MSAHMM.InsertState());
          hmm.updateNode(mk, new Graph.MSAHMM.MatchState(hmm.characters));
        }
      }
      // expand the inserted paths into the new match states 
      for (var pId in ipaths) {
        if (ipaths.hasOwnProperty(pId)) {
          for (var k = 0; k < ipaths[pId].length; k++) {
            var o = ipaths[pId][k],
                m = "m" + (j + k);
            hmm.nodes[m].attr.addPath(pId, o);
          }
        }
      }
      hmm.updateNode("i" + j, new Graph.MSAHMM.InsertState());
      // compute the transition probabilities for each inserted column
      for (var k = Math.max(0, j - 1); k < j + growBy; k++) {
        var d = "d" + k,
            i = "i" + (k + 1),
            m = "m" + k;
        hmm.updateNodeTransitionProbabilities(d);
        hmm.updateNodeTransitionProbabilities(i);
        hmm.updateNodeTransitionProbabilities(m);
      }
      hmm.numColumns += growBy;
    }
  }
}


/**
  * An HMM based MSA algorithm.
  * @param {Array} tracks - groups attribute of GCV track data.
  * @return {int} - The computed score.
  */
Graph.msa = function(tracks) {
  var groups = JSON.parse(JSON.stringify(tracks))
  var align = function(path, genes) {
    var x = 0,
        j = 0,
        insertionSize = 0;
    for (var i = 1; i < path.length; i++) {
      var n = path[i];
      if (n.startsWith("m") || n.startsWith("d") || n == "z") {
        if (insertionSize > 0) {
          var step = 1 / (insertionSize + 1);
          for (var k = insertionSize; k > 0; k--) {
            genes[j++].x = x - (k * step);
          }
          insertionSize = 0;
        }
        if (n.startsWith("m")) {
          genes[j++].x = x;
        }
        x++;
      } else {
        insertionSize++;
      }
    }
  }
  // 1) construct the graph from the first track
  var l = groups[0].genes.length,
      families = new Set();
  for (var i = 0; i < groups.length; i++) {
    for (var j = 0; j < groups[i].genes.length; j++) {
      families.add(groups[i].genes[j].family);
    }
  }
  var hmm = new Graph.MSAHMM(l, families);
  // 2) iteratively add each remaining track to the alignment
  for (var i = 0; i < groups.length; i++) {
    // a) align to HMM
    var seq1  = groups[i].genes.map((g) => g.family),
        path1 = Graph.MSAHMM.viterbi(hmm, seq1),
        seq2  = seq1.slice().reverse(),
        path2 = Graph.MSAHMM.viterbi(hmm, seq2);
    // b) embed alignment path and update transition and emission probabilities
    if (path1.probability >= path2.probability) {
      Graph.MSAHMM.embedPath(hmm, i, path1, seq1);
      //align(path1, groups[i].genes);
    } else {
      Graph.MSAHMM.embedPath(hmm, i, path2, seq2);
      groups[i].genes.reverse();
      groups[i].genes.map((g) => { g.strand *= -1 });
      //align(path2, groups[i].genes);
    }
    // c) if necessary, perform surgery on the graph
    Graph.MSAHMM.performSurgery(hmm);
  }
  // generate each track's final alignment
  for (var i = 0; i < groups.length; i++) {
    align(Graph.MSAHMM.getPath(hmm, i), groups[i].genes)
  }
  return groups;
}
