import { Graph } from "./graph";

/**
 * A directed graph that implements the abstract Graph class.
 */
export class Directed extends Graph {
  static Node = class extends Graph.Node {
    inNeighbors: Set<any>;
    outNeighbors: Set<any>;
    constructor(attr) {
      super(attr);
      this.inNeighbors  = new Set();
      this.outNeighbors = new Set();
    }
  };
  constructor(edgeDelimiter?) {
    super(edgeDelimiter);
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
  addEdge(u, v, attr?) {
    const e = this.getEdgeId(u, v);
    if (!this.edges.hasOwnProperty(e)) {
      this.nodes[u].outNeighbors.add(v);
      this.nodes[v].inNeighbors.add(u);
      this.edges[e] = attr;
    }
  }
  updateEdge(u, v, attr) {
    const e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      this.edges[e] = attr;
    }
  }
  removeEdge(u, v) {
    const e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      const attr = this.edges[e];
      delete this.edges[e];
      this.nodes[u].outNeighbors.delete(v);
      this.nodes[v].inNeighbors.delete(u);
      return attr;
    }
    return null;
  }
  getEdge(u, v) {
    const e = this.getEdgeId(u, v);
    if (this.edges.hasOwnProperty(e)) {
      return this.edges[e];
    }
    return null;
  }
}
