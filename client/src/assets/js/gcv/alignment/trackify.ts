/**
  * Converts alignments into micro-synteny viewer tracks.
  * @param {object} data - The original viewer tracks.
  * @param {Array} alignments - The alignments to be trackified.
  * @return {object} - A copy of data where the tracks are aligned.
  */
export default function trackify (data, alignments) {
  // make a copy of the data (tracks) and only save the first group (query)
  var aligned = JSON.parse(JSON.stringify(data)),
      query = aligned.groups[0];
  if (query !== undefined) {
    aligned.groups = [query];
    // initialize variables
    var length = query.genes.length;
    // update the context data with the alignment
    for (var k = 0; k < alignments.length; k++) {
      var queryCount = 0,
          preQuery = 0,
          insertionCount = 0,
          alignment = alignments[k],
          track = alignment.track;
      track.score = alignment.score;
      track.genes = [];
      for (var i = 0; i < alignment.sequence.length; i++) {
        // keep track of how many selected genes come before the query genes
        if (alignment.sequence[i] == null && queryCount == 0) {
          preQuery++;
        // an insertion
        } else if (alignment.sequence[i] == null) {
          // position the genes that come after the query genes
          if (queryCount >= length) {
            alignment.reference[i].x = queryCount++;
            alignment.reference[i].y = 0;
            track.genes.push(alignment.reference[i]);
          // track how many genes were inserted
          } else {
            insertionCount++;
          }
        // a deletion
        } else if (alignment.reference[i] == null) {
          queryCount++;
        // a (mis)match
        } else {
          // position the genes that came before the query
          if (preQuery > 0) {
            for (var j = 0; j < preQuery; j++) {
              alignment.reference[j].x = -(preQuery - (j + 1));
              alignment.reference[j].y = 0;
              track.genes.push(alignment.reference[j]);
            }
            preQuery = 0;
          // position the genes that go between query genes
          } else if (insertionCount > 0) {
            var step = 1.0 / (insertionCount + 1);
            for (var j = i - insertionCount; j < i; j++) {
              if (alignment.reference[j] != null) {
                alignment.reference[j].x = queryCount + (step * (i - j)) - 1;
                alignment.reference[j].y = 0;
                track.genes.push(alignment.reference[j]);
              }
            }
            insertionCount = 0;
          }
          alignment.reference[i].x = queryCount++;
          alignment.reference[i].y = 0;
          track.genes.push(alignment.reference[i]);
        }
      }
      aligned.groups.push(track);
    }
  }
  return aligned;
}
