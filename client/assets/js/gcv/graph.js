'use strict'

/** The Graph namespace. */
var Graph = Graph || {};


Graph.Undirected = class {
  constructor(edgeDelimiter) {
    this.ed    = edgeDelimiter || ":";
    this.nodes = {};
    this.edges = {};
  }
  // primitive operations
  addNode(id, attr) {
    if (!this.nodes.hasOwnProperty(id)) {
      this.nodes[id] = new Graph.Node(attr);
    } return this.getNode(id);
  }
  updateNode(id, attr) {
    if (this.nodes.hasOwnProperty(id)) {
      this.nodes[id] = attr;
    }
  }
  removeNode(id) {
    if (this.nodes.hasOwnProperty(id)) {
      this.nodes[id].neighbors.forEach((v) => {
        this.removeEdge(id, v);
      });
      delete this.nodes[id];
    }
  }
  getNode(id) {
    if (this.nodes.hasOwnProperty(id)) {
      return this.nodes[id];
    } return null;
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


Graph.Node = class {
  constructor(attr) {
    this.attr      = attr;
    this.neighbors = new Set();
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
  * @return {int} - The computed score.
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
