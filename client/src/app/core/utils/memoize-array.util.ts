import { MemoizedProjection } from '@ngrx/store';
import { arrayIsEqual } from './array-is-equal.util';


type AnyFn = (...args: any[]) => any;


export function memoizeArray(t: AnyFn): MemoizedProjection {
  let lastResult: any = null;

  function memoized(): any {
    const result = t.apply(null, arguments);
    if (lastResult === null || !arrayIsEqual(result, lastResult)) {
      lastResult = result;
      return result;
    }
    return lastResult;
  }

  function reset() {
    lastResult = null;
  }

  function setResult(result?: any) {
    lastResult = result;
  };

  return {memoized, reset, setResult};
}
