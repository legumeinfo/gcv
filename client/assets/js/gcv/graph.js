'use strict'

/** The Graph namespace. */
var Graph = Graph || {};


Graph.Graph = class {
  constructor(edgeDelimiter) {
    // make the class effectively abstract
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
      this.nodes[id] = attr;
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


Graph.Node = class {
  constructor(attr) {
    // make the class effectively abstract
    if (new.target === Graph.Node) {
      throw new TypeError("Cannot construct Node instances directly");
    }
    this.attr = attr;
  }
}


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
      delete this.edges[e];
      this.nodes[u].outNeighbors.delete(v);
      this.nodes[v].inNeighbors.delete(u);
    }
  }
  getEdge(u, v) {
    var e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      return this.edges[e];
    } return null;
  }
}


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
      delete this.edges[e];
      this.nodes[u].neighbors.delete(v);
      this.nodes[v].neighbors.delete(u);
    }
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
  * The Frequented Regions Algorithm.
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
  console.log("num nodes: " + Object.keys(g.nodes).length);
  console.log("num edges: " + Object.keys(g.edges).length);
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


Graph.MSAHMM = class extends Graph.Directed {
  constructor(numColumns, characters, edgeDelimiter) {
    super(edgeDelimiter)
    this.numColumns      = numColumns;
    this.numCharacters   = characters.size;
    this.baseProbability = 1 / (2 + this.numCharacters);
    this.constructModel(characters);
  }
  static State = class {
    constructor() {
      this.transitionCounts = {};
    }
    incrementTransition(id) {
      if (!this.transitionCounts.hasOwnProperty(id)) {
        this.transitionCounts[id] = 0;
      }
      this.transitionCounts[id] += 1;
    }
  }
  // primitive operations
  addEdge(u, v, attr) {
    super.addEdge(u, v, attr);
    this.nodes[u].attr.transitionCounts[v] = 0;
  }
  removeEdge(u, v) {
    super.removeEdge(u, v, attr);
    delete this.nodes[u].attr.transitionCounts[v];
  }
  // hmm operations
  indelTransitionProbability(pathsOnState, pathsOnTransition) {
    return (this.baseProbability * (pathsOnState + 1)) / (pathsOnTransition + 1);
  }
  matchTransitionProbability(pathsOnState, pathsOnTransition) {
    return this.numCharacters * this.indelTransitionProbability(pathsOnTransition, pathsOnState);
  }
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
  updateTransitionProbabilities() {
    for (var id in this.nodes) {
      if (this.nodes.hasOwnProperty(id)) {
        this.updateNodeTransitionProbabilities(id);
      }
    }
  }
  updateNodeTransitionProbabilities(id) {
    var pathsOnState = 0;
    for (var pId in this.nodes[id].attr.transitionCounts) {
      if (this.nodes[id].attr.transitionCounts.hasOwnProperty(pId)) {
        pathsOnState += this.nodes[id].attr.transitionCounts[pId];
      }
    }
    if (id == "d" + (this.numColumns - 1) ||
        id == "m" + (this.numColumns - 1) ||
        id == "i" + this.numColumns) {
      for (var nId in this.nodes[id].attr.transitionCounts) {
        if (this.nodes[id].attr.transitionCounts.hasOwnProperty(nId)) {
          var pathsOnTransition = this.nodes[id].attr.transitionCounts[nId];
          var p = this.indelTransitionProbability(pathsOnState, pathsOnTransition);
          if (nId.startsWith("a")) {
            p *= 2;
          }
          this.updateEdge(id, nId, p);
        }
      }
    } else {
      for (var nId in this.nodes[id].attr.transitionCounts) {
        if (this.nodes[id].attr.transitionCounts.hasOwnProperty(nId)) {
          var pathsOnTransition = this.nodes[id].attr.transitionCounts[nId];
          var p;
          if (nId.startsWith("m")) {
            p = this.matchTransitionProbability(pathsOnState, pathsOnTransition);
          } else {
            p = this.indelTransitionProbability(pathsOnState, pathsOnTransition);
          }
          this.updateEdge(id, nId, p);
        }
      }
    }
  }
}


Graph.MSAHMM.InsertState = class extends Graph.MSAHMM.State {
  constructor() {
    super();
    this.paths = {};
  }
  addPath(pId, o) {
    if (!this.paths.hasOwnProperty(pId)) {
      this.paths[pId] = [];
    }
    this.paths[pId].put(o);
  }
}


Graph.MSAHMM.MatchState = class extends Graph.MSAHMM.State {
  constructor(characters) {
    super();
    this.countAmplifier         = 1;
    this.paths                  = {};
    this.emissionCounts         = {};
    this.emissionProbabilities  = {};
    this.numObservations        = characters.size;
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
    for (var o in this.emissionProbabilities) {
      if (this.emissionCounts.hasOwnProperty(o)) {
        var p = this.emissionCounts[o] / this.numObservations;
        this.emissionProbabilities[o] = p;
      }
    }
  }
}

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
        currentPtr  = ptrs[to][i] || "",
        candidate   = probs[from][i - !to.startsWith("d")] +  // arithmetic HACK!
                      Math.log(hmm.getEdge(from, to));
    if (to.startsWith("m")) {
      candidate += hmm.getNode(to).attr.emit(seq[i]);
    }
    // TODO: use preferred transitions to resolve ties
    if (candidate > currentProb ||
       (candidate == currentProb && currentPtr < from)) {
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
  propagate(ij, e, seq.length);
  propagate(mj, e, seq.length);
  // follow the pointers from the end state to the start state to get the path
  return traceback(e, seq.length);
}


Graph.MSAHMM.embedPath = function(hmm, pId, path, seq) {
  var i = seq.length - 1;
  for (var j = 0; j < path.length - 1; j++) {
    var from = path[j],
        to   = path[j + 1],
        n    = hmm.getNode(from).attr;
    if (n instanceof Graph.MSAHMM.InsertState ||
        n instanceof Graph.MSAHMM.MatchState) {
      n.addPath(pId, seq[i--]);
    }
    n.incrementTransition(to);
    hmm.updateNodeTransitionProbabilities(from);
  }
}


/**
  * An HMM based MSA algorithm.
  * @param {Array} tracks - groups attribute of GCV track data.
  * @return {int} - The computed score.
  */
Graph.msa = function(groups) {
  var performSurgery = function(hmm) {

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
    console.log(groups[i].chromosome_name);
    // a) align to HMM
    var seq  = groups[i].genes.map((g) => g.family),
        path = Graph.MSAHMM.viterbi(hmm, seq);
    console.log(seq);
    console.log(path);
    // b) embed alignment path and update transition and emission probabilities
    Graph.MSAHMM.embedPath(hmm, i, path, seq);
    // c) if necessary, perform surgery on the graph
  }
  console.log(hmm);
}
