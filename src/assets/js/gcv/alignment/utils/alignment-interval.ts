/**
 * Takes a (local) alignment and converts it into an interval describing the
 * non-null portion of the alignment.
 * @param {Array<number>} a - The alignment to be converted.
 * @return {[number, number]} - A tuple describing the non-null interval of the
 * alignment.
 */
export function alignmentInterval(a: number[]): [number, number] {
  let i = 0;
  while (i < a.length && a[i] === null) {
    i += 1;
  }
  const begin = i;
  i = a.length - 1;
  while (i >= 0 && a[i] === null) {
    i -= 1;
  }
  const end = i;
  return [begin, end];
}
