/**
 * Sums the numbers in the given arrays.
 * @param {Array<number>} - The array to sum.
 * @return {number} - The sum.
 */
export function sum(l) {
  const ls = l.filter((e) => e !== null);
  if (ls.length === 0) {
    return 0;
  }
  return ls.reduce((a, b) => a + b);
}
