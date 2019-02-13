/**
 * Merges overlapping tracks from the same group to maximize alignment score.
 * @param {object} tracks - The micro-synteny viewer tracks to be merged.
 */
export function merge(tracks) {
// make a copy of the data (tracks)
  const mergedTracks = {families: tracks.families, groups: []};
  // groups tracks by group id
  const groups = {};
  for (let i = 0; i < tracks.groups.length; i++) {  // skip first (query) track
    const track = tracks.groups[i];
    groups[track.id] = groups[track.id] || [];
    groups[track.id].push(track);
  }
  // try to merge each partition
  for (const id in groups) {
    if (!groups.hasOwnProperty(id)) {
      continue;
    }
    const groupTracks = groups[id];
    const merged = [];  // which tracks have been merged into another
    // iterate pairs of tracks to see if one is a sub-inversion of the other
    for (let j = 0; j < groupTracks.length; j++) {
      if (merged.indexOf(j) !== -1) {
        continue;
      }
      const jTrack = groupTracks[j];
      let jLevels = 0;
      const jIds = jTrack.genes.map((g) => g.id);
      for (let k = j + 1; k < groupTracks.length; k++) {
        if (merged.indexOf(j) !== -1 || merged.indexOf(k) !== -1) {
          continue;
        }
        const kTrack = groupTracks[k];
        let kLevels = 0;
        const kIds = kTrack.genes.map((g) => g.id);
        // compute the intersection
        const overlap = jIds.filter((jId) => {
          return kIds.indexOf(jId) !== -1;
        });
        if (overlap.length > 0) {
          // j is the inversion
          if (kIds.length > jIds.length) {
            // get index list
            const indices = overlap.map((jId) => {
              return kIds.indexOf(jId);
            });
            // compute the score of the inverted sequence before inverting
            const min = Math.min.apply(null, indices);
            let max = Math.max.apply(null, indices);
            const startGene = kTrack.genes[min];
            const endGene = kTrack.genes[max];
            const score = endGene.score - startGene.score;
            // perform the inversion if it will improve the super-track's score
            if (jTrack.score > score) {
              merged.push(j);
              // increment the level counter
              kLevels++;
              // perform the inversion
              jTrack.genes.reverse();
              const args = [min, max - min + 1];
              const geneArgs = args.concat(jTrack.genes);
              Array.prototype.splice.apply(kTrack.genes, geneArgs);
              // adjust inversion scores and y coordinates
              max = min + jTrack.genes.length;
              const pred = (min > 0) ? kTrack.genes[min - 1].score : 0;
              for (let l = min; l < max; l++) {
                kTrack.genes[l].score += pred;
                kTrack.genes[l].y = kLevels;
              }
              // adjust post-inversion scores
              const adjustment = jTrack.score - score;
              for (let l = max; l < kTrack.genes.length; l++) {
                kTrack.genes[l].score += adjustment;
              }
              kTrack.score += adjustment;
            }
          // k is the inversion
          } else if (jIds.length >= kIds.length) {
            // get index list
            const indices = overlap.map((jId) => {
              return jIds.indexOf(jId);
            });
            // compute the score of the inverted sequence before inverting
            const min = Math.min.apply(null, indices);
            let max = Math.max.apply(null, indices);
            const startGene = jTrack.genes[min];
            const endGene = jTrack.genes[max];
            const score = endGene.score - startGene.score;
            // perform the inversion if it will improve the super-track's score
            if (kTrack.score > score) {
              merged.push(k);
              // increment the level counter
              jLevels++;
              // perform the inversion
              kTrack.genes.reverse();
              const args = [min, max - min + 1];
              const geneArgs = args.concat(kTrack.genes);
              const idArgs = args.concat(kIds);
              Array.prototype.splice.apply(jTrack.genes, geneArgs);
              Array.prototype.splice.apply(jIds, idArgs);
              // adjust inversion scores and y coordinates
              max = min + kTrack.genes.length;
              const pred = (min > 0) ? jTrack.genes[min - 1].score : 0;
              for (let l = min; l < max; l++) {
                jTrack.genes[l].score += pred;
                jTrack.genes[l].y = jLevels;
              }
              // adjust post-inversion scores
              const adjustment = kTrack.score - score;
              for (let l = max; l < jTrack.genes.length; l++) {
                jTrack.genes[l].score += adjustment;
              }
              jTrack.score += adjustment;
            }
          }
        }
      }
      // add the track if it wasn't merged during its iteration
      if (merged.indexOf(j) === -1) {
        mergedTracks.groups.push(jTrack);
      }
    }
  }
  return mergedTracks;
}
