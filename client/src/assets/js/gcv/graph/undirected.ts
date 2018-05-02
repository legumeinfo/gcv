import { Graph } from "./graph";

/**
 * An undirected graph that implements the abstract Graph class.
 */
export class Undirected extends Graph {
  static Node = class extends Graph.Node {
    neighbors: Set<any>;
    constructor(attr) {
      super(attr);
      this.neighbors = new Set();
    }
  };
  constructor(edgeDelimiter?) {
    super(edgeDelimiter);
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
  addEdge(u, v, attr?) {
    const e = this.getEdgeId(u, v);
    if (!this.edges.hasOwnProperty(e)) {
      this.nodes[u].neighbors.add(v);
      this.nodes[v].neighbors.add(u);
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
      this.nodes[u].neighbors.delete(v);
      this.nodes[v].neighbors.delete(u);
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
    const e = this.getEdge(u, v);
    if (e != null) {
      const [keep, remove] = (u < v) ? [u, v] : [v, u];
      const keepNode = this.getNode(keep);
      const removeNode = this.getNode(remove);
      keepNode.attr = contractF(keepNode.attr, removeNode.attr, e);
      // update "keep" edges
      keepNode.neighbors.forEach((w) => {
        if (w !== remove) {
          const wAttr = this.getNode(w).attr;
          const eAttr = this.getEdge(keep, w);
          const attr = updateF(keepNode.attr, wAttr, eAttr);
          this.updateEdge(keep, w, attr);
        }
      });
      // replace "remove" edges
      removeNode.neighbors.forEach((w) => {
        if (w !== keep && this.getEdge(keep, w) == null) {
          const wAttr = this.getNode(w).attr;
          const eAttr = this.getEdge(remove, w);
          const attr = updateF(keepNode.attr, wAttr, eAttr);
          this.addEdge(keep, w, attr);
        }
      });
      this.removeNode(remove);
    }
  }
}
