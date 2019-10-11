import { arrayIsEqual } from './array-is-equal.util';
import { elementIsVisible } from './element-is-visible.util';
import { memoizeArray } from './memoize-array.util';


export const utils: any[] = [
  arrayIsEqual,
  elementIsVisible,
  memoizeArray,
];


export * from './array-is-equal.util';
export * from './element-is-visible.util';
export * from './memoize-array.util';
