/**
 * An effectively abstract class describing what it means to be a graph.
 */
export abstract class Graph {
  static Node = class {
    attr: any;
    constructor(attr) {
      if (new.target === Graph.Node) {
        throw new TypeError("Cannot construct Node instances directly");
      }
      this.attr = attr;
    }
  };
  ed: string;
  nodes: object;
  edges: object;
  Child: any;
  constructor(edgeDelimiter = ":") {
    if (new.target === Graph) {
      throw new TypeError("Cannot construct Graph instances directly");
    }
    this.Child = new.target;
    this.checkStaticOverride("Node");
    this.ed    = edgeDelimiter;
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
      this.nodes[id] = new this.Child.Node(attr);
    }
    return this.getNode(id);
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
    }
    return null;
  }
  // abstract methods
  abstract removeNodeEdges(id): void;
  abstract addEdge(u, v, attr?): void;
  abstract updateEdge(u, v, attr): void;
  abstract removeEdge(u, v): void;
  abstract getEdge(u, v): any;
}
