// store
import { MemoizedProjection } from '@ngrx/store';
// app
import { arrayIsEqual, compare, objectIsEqual } from './comparators.util';


type AnyFn = (...args: any[]) => any;


export const selectorMemoizerFactory = (comparator: Function) => {
  return (t: AnyFn): MemoizedProjection => {
    let lastResult: any = null;
    let overrideResult: any;

    function memoized(): any {
      if (overrideResult !== undefined) {
        return overrideResult.result;
      }
      const result = t.apply(null, arguments);
      if (lastResult === null || !comparator(result, lastResult)) {
        lastResult = result;
        return result;
      }
      return lastResult;
    }

    function reset() {
      lastResult = null;
      overrideResult = null;
    }

    function setResult(result: any = undefined) {
      lastResult = {result};
    };

    function clearResult() {
      overrideResult = undefined;
    }

    return {memoized, reset, setResult, clearResult};
  }
};


export const memoizeArray = selectorMemoizerFactory(arrayIsEqual);
export const memoizeObject = selectorMemoizerFactory(objectIsEqual);
export const memoizeValue = selectorMemoizerFactory(compare);
