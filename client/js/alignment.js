'use strict'

/** The Alignment namespace. */
var Alignment = Alignment || {};


/** The Smith-Waterman algorithm. */
Alignment.smithWaterman = function () {
}


/** The Repeat algorithm by Durbin et al. */
Alignment.repeat = function () {
}


/**
  * Merges alignments and sets coordinates for the context viewer.
  * @param {object} data - The context viewer to be given coordinates.
  * @param {object} selected - The data groups selected to be merged.
  * @param {Array} alignments - The alignments to be merged.
  */
Alignment.merge = function (data, selected, alignments) {
  // initialize variables
  var n = data.groups.length,
      length = data.groups[0].genes.length;
  // update the context data with the alignment
  for (var k = 0; k < alignments.length; k++) {
    var queryCount = 0,
        preQuery = 0,
        insertionCount = 0,
        alignment = alignments[k],
        index = n + k;
    data.groups.push(selected[k]);
    data.groups[index].genes = [];
    for (var i = 0; i < alignment[0].length; i++) {
      // keep track of how many selected genes come before the query genes
      if (alignment[0][i] == null && queryCount == 0) {
        preQuery++;
      // it must be an insertion
      } else if (alignment[0][i] == null) {
        // position the genes that come after the query genes
        if (queryCount >= length) {
          alignment[1][i].x = queryCount++;
          alignment[1][i].y = k + 1;
          data.groups[index].genes.push(alignment[1][i]);
        // track how many genes were inserted
        } else {
          insertionCount++;
        }
      // a deletion
      } else if (alignment[1][i] == null) {
        queryCount++;
      // an alignment
      } else {
        // position the genes that came before the query
        if (preQuery > 0) {
          for (var j = 0; j < preQuery; j++) {
            alignment[1][j].x = -1 * (preQuery - (j + 1));
            alignment[1][j].y = k + 1;
            data.groups[index].genes.push(alignment[1][j]);
          }
          preQuery = 0;
        // position the genes that go between query genes
        } else if (insertionCount > 0) {
          var step = 1.0 / (insertionCount + 1);
          for (var j = i - insertionCount; j < i; j++) {
            if (alignment[1][j] != null) {
              alignment[1][j].x = queryCount + (step * (i - j)) - 1;
              alignment[1][j].y = k + 1;
              data.groups[index].genes.push(alignment[1][j]);
            }
          }
          insertionCount = 0;
        }
        alignment[1][i].x = queryCount++;
        alignment[1][i].y = k + 1;
        data.groups[index].genes.push(alignment[1][i]);
      }
    }
  }
}
