import { enumerableProperties } from './enumerable-properties.util';


// determines if two elements are equal
export const compare = (x: any, y: any) => {
  if (typeof x !== typeof y) return false;
  if (Array.isArray(x)) return arrayIsEqual(x, y);
  if (typeof x == 'object') return objectIsEqual(x, y);

  return x === y;
};


// determines if two arrays have equal content
export const arrayIsEqual = (a: any[], b: any[]) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  return a.every((e, i) => compare(e, b[i]));
};


// determines if two objects have equal content
export const objectIsEqual = (a: Object, b: Object) => {
  if (a === b) return true;
  if (a == null || b == null) return false;

  const aKeys = enumerableProperties(a).sort();
  const bKeys = enumerableProperties(b).sort();
  if(!arrayIsEqual(aKeys, bKeys)) return false;

  return aKeys.every((k) => compare(a[k], b[k]));
};
