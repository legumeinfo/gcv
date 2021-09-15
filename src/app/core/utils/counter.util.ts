// keeps an internal count that is incremented at each get call
class Counter {

  private _count = 0;

  getCount() {
    return this._count++;
  }
}

// singleton
export const counter = new Counter();
