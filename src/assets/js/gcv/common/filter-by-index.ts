/**
 * Given an array of elements and an array of indexes, the function returns an
 * array containing elements only from the given indexes.
 * @param {Array<T>} a - The array to filter.
 * @param {Array<number>} idx - The indexes to filter the array with.
 * @return {Array<T>} - The filtered array. Note, the elements are ordered
 * according to the index array.
 */
export function filterByIndex<T>(a: T[], idx: number[]): T[] {
  return idx.map((i) => a[i]);
}
