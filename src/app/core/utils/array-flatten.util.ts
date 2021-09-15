// flattens a 2d array into a 1d array
export function arrayFlatten<T>(a: T[][]): T[] {
  return [].concat.apply([], a);
}
