/**
 * Converts the inverted portion of an alignment into a track portion.
 * @param {number} i - The current position in the reference alignment.
 * @param {number} insertionCount - The genes to be inserted.
 * @param {number} queryCount - The number of query genes that have been
 * inserted.
 * @param {object} alignment - The alignment object to use.
 * @param {Array} track - The current track being constructed.
 */
function insertion(i, insertionCount, queryCount, alignment, track) {
  const start = i - insertionCount;
  const step  = 1.0 / (insertionCount + 1);
  for (let j = start; j < i; j++) {
    if (alignment.reference[j] != null) {
      alignment.reference[j].x = queryCount + (step * (j - start + 1)) - 1;
      alignment.reference[j].y = 0;
      track.genes.push(alignment.reference[j]);
    }
  }
}

/**
 * Converts alignments into micro-synteny viewer tracks.
 * @param {object} query - The reference tracck that all others were aligned to.
 * @param {object} tracks - The original viewer tracks.
 * @param {Array} alignments - The alignments of the tracks to be trackified.
 * @return {object} - A new set of MicroTracks derived from the alignments.
 */
export default function trackify(query, tracks, alignments) {
  // make a copy of the data (tracks) and only save the first group (query)
  //const aligned = JSON.parse(JSON.stringify(data));
  const aligned = {families: tracks.families, groups: []};
  //const query = aligned.groups[0];
  if (query !== undefined) {
    //aligned.groups = [query];
    // initialize letiables
    const length = query.genes.length;
    // update the context data with the alignment
    for (const alignment of alignments) {
      let queryCount     = 0;
      let preQuery       = 0;
      let insertionCount = 0;
      const track          = alignment.track;
      track.score = alignment.score;
      track.genes = [];
      for (let i = 0; i < alignment.sequence.length; i++) {
        // keep track of how many selected genes come before the query genes
        if (alignment.sequence[i] === null && queryCount === 0) {
          preQuery += 1;
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
          if (insertionCount > 0) {
            insertion(i, insertionCount, queryCount, alignment, track);
            insertionCount = 0;
          }
          queryCount++;
        // a (mis)match
        } else {
          // position the genes that came before the query
          if (preQuery > 0) {
            for (let j = 0; j < preQuery; j++) {
              alignment.reference[j].x = -(preQuery - (j + 1));
              alignment.reference[j].y = 0;
              track.genes.push(alignment.reference[j]);
            }
            preQuery = 0;
          // position the genes that go between query genes
          } else if (insertionCount > 0) {
            insertion(i, insertionCount, queryCount, alignment, track);
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
