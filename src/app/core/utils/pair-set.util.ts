export class PairSet implements Iterable<[any, any]>{

  // represent pairs using a dictionary of sets, i.e. a 2D set
  private _2dSet = {};

  // instantiate a new set from the given list of pairs
  constructor(initPairs: Array<[any, any]> = []) {
    initPairs.forEach(([x, y]) => this.add(x, y));
  }

  // add a new pair to the set
  public add(x, y) {
    if (!this._2dSet[x]) {
      this._2dSet[x] = new Set();
    }
    this._2dSet[x].add(y);
  }
  
  // check if a pair is in the set
  public has(x, y) {
    return !!(this._2dSet[x] && this._2dSet[x].has(y));
  }
  
  // delete a pair from the set
  public del(x, y) {
    if (!this._2dSet[x]) {
      return;
    }
    this._2dSet[x].delete(y);
    if (this._2dSet[x].size === 0) {
      delete this._2dSet[x];
    }
  }

  // make the class iterable
  *[Symbol.iterator](): Iterator<[any, any]> {
    for (const [x, ySet] of Object.entries(this._2dSet)) {
      for (const y of (ySet as Set<any>).values()) {
        yield [x, y];
      }
    }
  }

}
