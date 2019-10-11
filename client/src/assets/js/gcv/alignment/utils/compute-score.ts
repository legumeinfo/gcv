/**
 * Uses an accessor to compute a score by comparing the given elements.
 * @param {T} a - The first element.
 * @param {T} b - The second element.
 * @param {object} scores - The contains the match and mismatch scores.
 * @return {int} - The computed score.
 */
export function computeScore<T>(a: T, b: T, scores, omit=new Set()): number {
  if (a === b && !omit.has(a)) {
    return scores.match;
  }
  return scores.mismatch;
}
