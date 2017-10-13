/**
  * Uses an accessor to compute a score by comparing the given elements.
  * @param {generic} a - The first element.
  * @param {generic} b - The second element.
  * @param {function} accessor - The accessor used to compare elements.
  * @param {object} scores - The contains the match and mismatch scores.
  * @return {int} - The computed score.
  */
export function computeScore (a, b, accessor, scores) {
  a = accessor(a);
  b = accessor(b);
	if (a === b && a != '') {
		return scores.match;
	} return scores.mismatch;
}

/**
  * Creates a matrix with the given initial value.
  * @param {number} m - Number of columns.
  * @param {number} n - Number of rows.
  * @param {number} initial - The initial value to put in each cell.
  * @return {Array} - An m x n array with initial value in each cell.
  */
export function matrix (m, n, initial) {
  var a, i, j, mat = [];
  for (i = 0; i < m; i += 1) {
    a = [];
    for (j = 0; j < n; j += 1) {
      a[j] = initial;
    }
    mat[i] = a;
  }
  return mat;
};
