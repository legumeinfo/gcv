import { Undirected } from "./undirected";

/**
 * A class that represents a Frequented Region.
 */
export class FR {
  nodes: any[];
  descendants: any[];
  paths: object;
  intervals: object;
  supporting: any[];
  avgAlpha: number;
  constructor(nodes = []) {
    this.nodes = nodes;
    this.descendants = [];
    this.paths = {};
    this.intervals = {};
    this.supporting = [];
    this.avgAlpha = 0;
  }
  addToPath(pId, n, kappa) {
    if (!this.paths.hasOwnProperty(pId)) {
      this.paths[pId] = [];
    }
    this.paths[pId].push(n);
    if (!this.intervals.hasOwnProperty(pId)) {
      this.intervals[pId] = [];
    }
    const halfKappa = kappa / 2;
    // (begin, end, nodes spanned)
    this.intervals[pId].push([n - halfKappa, n + halfKappa, 1]);
  }
  mergeIntervals(hardSpan) {
    const comparePoints = (a, b) => {
      const [ap, ac, as] = a;
      const [bp, bc, bs] = b;
      if (ap < bp || (ap === bp && ac > bc)) {
        return -1;
      } else if (bp < ap || (bp === ap && bc > ac)) {
        return 1;
      }
      return 0;
    };
    for (const pId in this.intervals) {
      if (this.intervals.hasOwnProperty(pId)) {
        const points = [];
        for (const interval of this.intervals[pId]) {
          const [begin, end, span] = interval;
          points.push([begin, 1, span]);
          points.push([end, -1, 0]);
        }
        points.sort(comparePoints);
        const combinedIntervals = [];
        let counter = 0;
        let begin = 0;
        let span = 0;
        for (const point of points) {
          const [p, c, s] = point;
          if (counter === 0) {
            begin = p;
            span = 0;
          }
          counter += c;
          span += s;
          if (counter === 0) {
            combinedIntervals.push([begin, p, hardSpan || span]);
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
    for (const pId in this.intervals) {
      if (this.intervals.hasOwnProperty(pId)) {
        let maxAlpha = 0;
        for (const interval of this.intervals[pId]) {
          const iAlpha = interval[2] / this.nodes.length;
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
    const fr = new FR();
    fr.nodes = this.nodes.concat(other.nodes);
    fr.descendants = [this, other];
    fr.paths = Object.assign({}, this.paths);
    fr.intervals = Object.assign({}, this.intervals);
    for (const id in other.paths) {
      if (fr.paths.hasOwnProperty(id)) {
        fr.paths[id] = fr.paths[id].concat(other.paths[id]);
      } else {
        fr.paths[id] = other.paths[id].slice();
      }
    }
    for (const id in other.intervals) {
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
 * @return {FRs[]} - An array of FR hierarchies.
 */
export function frequentedRegions(tracks, alpha, kappa, minsup, minsize, options) {
  const omit = options.omit || [];
  const contractF = (uFR, vFR, eFR) => {
    return eFR;
  };
  const updateF = (uFR, vFR, eFR?) => {
    const fr = uFR.merge(vFR);
    fr.computeSupport(alpha);
    return fr;
  };
  const findFRs = (root, minsup, minsize, prevsup) => {
    const frs = [];
    let sup = prevsup;
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
    }
    return root.descendants;
  };
  // build a gene family FR graph
  const g = new Undirected();
  // add nodes with FRs as attributes
  for (let i = 0; i < tracks.groups.length; i++) {
    for (let j = 0; j < tracks.groups[i].genes.length; j++) {
      const id = tracks.groups[i].genes[j].family;
      if (omit.indexOf(id) === -1) {
        let n = g.getNode(id);
        if (n == null) {
          n = g.addNode(id, new FR([id]));
        }
        n.attr.addToPath(i, j, kappa);
      }
    }
  }
  for (const id of Object.keys(g.nodes)) {
    g.nodes[id].attr.computeSupport(alpha, 1);
  }
  // add edges with FRs resulting from contraction as attributes
  for (const group of tracks.groups) {
    let prevId = null;
    let prevN = null;
    for (const gene of group.genes) {
      const id = gene.family;
      const n = g.getNode(id);
      if (prevN !== null && n !== null &&
      g.getEdge(prevId, id) === null && prevId !== id) {
        g.addEdge(prevId, id, updateF(prevN.attr, n.attr));
      }
      if (n !== null && prevId !== id) {
        prevId = id;
        prevN = n;
      }
    }
  }
  // iteratively contract edges in most support first order
  let fr = null;
  while (Object.keys(g.edges).length > 0) {
    // find max edge weight
    let maxFR = null;
    let maxE = null;
    for (const e in g.edges) {
      if (g.edges.hasOwnProperty(e) && (maxFR === null ||
      maxFR.avgAlpha < g.edges[e].avgAlpha)) {
        maxFR = g.edges[e];
        maxE = e;
      }
    }
    if (fr == null || fr.nodes.length < maxFR.nodes.length) {
      fr = maxFR;
    }
    const [u, v] = maxE.split(g.ed);
    // contract edge
    g.contractEdge(u, v, contractF, updateF);
  }
  // return interesting FRs identified by traversing hierarchy
  return (fr !== null) ? findFRs(fr, minsup, minsize, 0) : [];
}
