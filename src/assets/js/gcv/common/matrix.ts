/**
 * Creates a matrix with the given initial value.
 * @param {number} m - Number of columns.
 * @param {number} n - Number of rows.
 * @param {number} initial - The initial value to put in each cell.
 * @return {number[][]} - An m x n array with initial value in each cell.
 */
export function matrix(m, n, initial) {
  let a;
  let i;
  let j;
  const mat = [];
  for (i = 0; i < m; i += 1) {
    a = [];
    for (j = 0; j < n; j += 1) {
      a[j] = initial;
    }
    mat[i] = a;
  }
  return mat;
}
