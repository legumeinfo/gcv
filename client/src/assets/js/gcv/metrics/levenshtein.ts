import { matrix } from '../common';


export const levenshtein = <T>(a: T[], b: T[]): number => {
  const i = a.length;
  const j = b.length;
  const t = matrix(i+1, j+1, null);
  return levenshteinRecurrence(a, i, b, j, t);
}


const levenshteinRecurrence =
<T>(a: T[], i: number, b: T[], j: number, t: number[]): number => {
  // use memoized data if possible
  if (t[i][j] === null) {
    // base case: empty strings
    if (i == 0) {
      t[i][j] = j;
    } else if (j == 0) {
      t[i][j] = i;
    // test if last characters of the strings match
    } else {
      let cost = (a[i-1] == b[j-1] ? 0 : 1);
      // return minimum of delete char from a, delete char from b, and delete
      // char from both
      t[i][j] = Math.min(levenshteinRecurrence(a, i-1, b, j, t)+1,
                         levenshteinRecurrence(a, i, b, j-1, t)+1,
                         levenshteinRecurrence(a, i-1, b, j-1, t)+cost);
    }
  }
  return t[i][j];
}
