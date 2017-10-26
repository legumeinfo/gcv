import { Undirected } from './undirected';


/**
  * A class that represents a Frequented Region.
  */
export class FR {
  nodes: Array<any>;
  descendants: Array<any>;
  paths: Object;
  intervals: Object;
  supporting: Array<any>;
  avgAlpha: number;
  constructor(nodes=[]) {
    this.nodes       = nodes;
    this.descendants = [];
    this.paths       = {};
    this.intervals   = {};
    this.supporting  = [];
    this.avgAlpha    = 0;
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
          let [begin, end, span] = this.intervals[pId][i];
          points.push([begin, 1, span])
          points.push([end, -1, 0])
        }
        points.sort(comparePoints)
        var combinedIntervals = [];
        let counter           = 0,
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
    this.avgAlpha = 0;
    for (var pId in this.intervals) {
      if (this.intervals.hasOwnProperty(pId)) {
        var maxAlpha = 0;
        for (var i = 0; i < this.intervals[pId].length; i++) {
          var iAlpha = this.intervals[pId][i][2] / this.nodes.length;
          if (iAlpha >= alpha) {
            this.supporting.push(pId);
            if (iAlpha > maxAlpha) {
              maxAlpha = iAlpha;
            }
          }
        }
        this.avgAlpha += maxAlpha;
      }
    }
  }
  merge(other) {
    var fr = new FR()
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
export function frequentedRegions
(tracks, alpha, kappa, minsup, minsize, options) {
  var omit = options.omit || [];
  var contractF = function(uFR, vFR, eFR) {
    return eFR;
  }
  var updateF = function(uFR, vFR, eFR?) {
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
  var g = new Undirected()
  // add nodes with FRs as attributes
  for (var i = 0; i < tracks["groups"].length; i++) {
    for (var j = 0; j < tracks["groups"][i]["genes"].length; j++) {
      var id = tracks["groups"][i]["genes"][j]["family"];
      if (omit.indexOf(id) == -1) {
        var n = g.getNode(id);
        if (n == null) {
          n = g.addNode(id, new FR([id]));
        }
        n.attr.addToPath(i, j, kappa)
      }
    }
  }
  for (let id in g.nodes) {
    g.nodes[id].attr.computeSupport(alpha, 1);
  }
  // add edges with FRs resulting from contraction as attributes
  for (var i = 0; i < tracks["groups"].length; i++) {
    var prevId = null,
        prevN  = null;
    for (var j = 0; j < tracks["groups"][i]["genes"].length; j++) {
      var id  = tracks["groups"][i]["genes"][j]["family"],
          n   = g.getNode(id);
      if (prevN != null && n != null &&
      g.getEdge(prevId, id) == null && prevId != id) {
        g.addEdge(prevId, id, updateF(prevN.attr, n.attr));
      }
      if (n != null && prevId != id) {
        prevId = id;
        prevN  = n;
      }
    }
  }
  // iteratively contract edges in most support first order
  var fr = null;
  while (Object.keys(g.edges).length > 0) {
    // find max edge weight
    var maxFR = null,
        maxE  = null;
    for (var e in g.edges) {
      if (g.edges.hasOwnProperty(e) && (maxFR == null ||
      maxFR.avgAlpha < g.edges[e].avgAlpha)) {
        maxFR = g.edges[e];
        maxE  = e;
      }
    }
    if (fr == null || fr.nodes.length < maxFR.nodes.length) {
      fr = maxFR;
    }
    var [u, v] = maxE.split(g.ed);
    // contract edge
    g.contractEdge(u, v, contractF, updateF);
  }
  // return interesting FRs identified by traversing hierarchy
  return (fr !== null) ? findFRs(fr, minsup, minsize, 0) : [];
}
