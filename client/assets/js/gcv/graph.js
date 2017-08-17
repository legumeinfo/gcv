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
    super(edgeDelimiter)
    this.inNeighbors  = {};
    this.outNeighbors = {};
  }
  static Node = class extends Graph.Node {
    constructor(attr) {
      super(att);
      this.inNeighbors  = new Set();
      this.outNeighbors = new Set();
    }
  }
  // primitive operations
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
  constructor(size, observations, edgeDelimiter) {
    super(edgeDelimiter)
    this.size = size;
    constructModel(observations);
  }
  static State = class {
    constructor() {
      this.paths = new Set();
    }
    addPath(pId) {
      this.paths.add(pId);
    }
  }
  constructModel(observations) {
    // add nodes
    hmm.addNode("s");
    for (var i = 0; i < l; i++) {
      var id = "m" + i,
          m = new Graph.hmmMatch(families);
      hmm.addNode(id, m);
      id = "i" + i;
      hmm.addNode(id, new Graph.hmmInsert());
      id = "d" + i;
      hmm.addNode(id, new Graph.hmmNode());
    }
    hmm.addNode("i" + l, new Graph.hmmInsert());
    hmm.addNode("e");
    // add edges
    g.addEdge("s", "m0", 1.0);
    g.addEdge("s", "i0", 0.0);
    g.addEdge("s", "d0", 0.0);
    for (var i = 0; i < l - 1; i++) {
      g.addEdge("m" + i, "m" + (i + 1), 1.0);
      g.addEdge("m" + i, "i" + (i + 1), 0.0);
      g.addEdge("m" + i, "d" + (i + 1), 0.0);
      g.addEdge("i" + i, "i" + i, 0.0);
      g.addEdge("i" + i, "m" + i, 0.0);
      g.addEdge("i" + i, "d" + i, 0.0);
      g.addEdge("d" + i, "d" + (i + 1), 0.0);
      g.addEdge("d" + i, "m" + (i + 1), 0.0);
      g.addEdge("d" + i, "i" + (i + 1), 0.0);
    }
    g.addEdge("m" + l - 1, "i" + l, 0.0);
    g.addEdge("m" + l - 1, "e", 1.0);
    g.addEdge("i" + l, "i" + l, 0.0);
    g.addEdge("i" + l, "e", 0.0);
    g.addEdge("d" + l - 1, "i" + l, 0.0);
    g.addEdge("d" + l - 1, "e", 0.0);
  }
}


Graph.MSAHMM.InsertState = class extends Graph.MSAHMM.State {
  constructor() {
    super();
    this.insertions = {};
  }
  addPath(pId, o) {
    super.addPath(pId);
    if (!this.insertions.hasOwnProperty(pId)) {
      this.insertions[pId] = [];
    }
    this.insertions[pId].put(o);
  }
}


Graph.MSAHMM.MatchState = class extends Graph.MSAHMM.State {
  constructor(observations) {
    super();
    this.emissions = {};
    this.counts = {};
    this.numObservations = observations.size();
    var p = 1 / numObservations;
    observations.forEach((o) => {
      this.emissions[o] = p;
      this.counts[o]    = 1;  // pseudo-count of for computing emissions
    });
  }
  addPath(pId, o) {
    super.addPath(pId);
    this.counts[o]       += 1;
    this.numObservations += 1;
    for (var o in this.emmisions) {
      if (this.emmisions.hasOwnProperty(o)) {
        var p = this.counts[o] / this.numObservations;
        this.emmisions[o] = p;
      }
    }
  }
}


/**
  * An HMM based MSA algorithm.
  * @param {object} tracks - Ordered GCV track data.
  * @param {function} alignmentF - The alignment algorithm to be used.
  * @return {int} - The computed score.
  */
Graph.msa = function(tracks, alignmentF) {
  var embedAlignmentPath = function(hmm, pId, states, observations) {
    for (var i = 0; i < states.length; i++) {
      var n = hmm.getNode(states[i]).attr;
      if (n instanceof Graph.hmmInsert || n instanceof Graph.hmmMatch) {
        n.addPath(pId, observations[i]);
      } else {
        n.addPath(pId);
      }
    }
  }
  var performSurgery = function(hmm) {

  }
  // 1) construct the graph from the first track
  var l = tracks.groups[0].genes.length,
      families = new Set();
  for (var i = 0; i < tracks.groups.length; i++) {
    for (var j = 0; j < tracks.groups[i].genes.length; j++) {
      families.add(tracks.groups[i].genes[j].family);
    }
  }
  var hmm = new Graph.Directed(l, families);
  // 2) iteratively add each remaining track to the alignment
  for (var i = 1; i < tracks.groups.length; i++) {
    // a) align to HMM
    // b) update the transition and emission probabilities using the new alignment
    // c) if necessary, perform surgery on the graph
  }
}
